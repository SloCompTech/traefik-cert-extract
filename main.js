#!/usr/bin/env node

const Docker = require('dockerode');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const yargs = require('yargs');

// Arguments
const argv = yargs
  .option('d', {
    alias: 'directory',
    demandOption: true,
    description: 'Output directory',
    type: 'string',
  })
  .option('e', {
    alias: 'exclude',
    default: [],
    description: 'Exclude domain',
    type: 'array',
  })
  .option('f', {
    alias: 'file',
    demandOption: true,
    description: 'File that contains Traefik certificates',
    type: 'string',
  })
  .option('i', {
    alias: 'include',
    default: [],
    description: 'Include domain',
    type: 'array',
  })
  .option('r', {
    alias: 'docker-restart',
    default: false,
    description: 'Restart docker containers with label tce.restart=true',
    type: 'boolean',
  })
  .option('x', {
    alias: 'exclude-provider',
    default: [],
    description: 'Exclude listed providers',
    type: 'array',
  })
  .option('y', {
    alias: 'include-provider',
    default: [],
    description: 'Only process listed providers',
    type: 'array',
  })
  .argv;

// Check if certificate file exists
if (!fs.existsSync(argv.file) || !fs.statSync(argv.file).isFile()) {
  console.error(`File ${argv.file} doesn't exist`);
  process.exit(1);
}

// Check if destination directory exists
if (!fs.existsSync(argv.directory) || !fs.statSync(argv.directory).isDirectory()) {
  console.error(`Destination directory ${argv.directory} doesn't exist`);
  process.exit(2);
}

// Read certificate file
let data = {};
try {
  const file = fs.readFileSync(argv.file);
  data = JSON.parse(file);
} catch (error) {
  console.error(error);
  process.exit(3);
}

const providers = Object.keys(data); // Get providers
for (const provider of providers) {
  if (argv.excludeProvider.includes(provider)) // Provider excluded from processing
    continue;
  if (argv.includeProvider.length > 0 && !argv.includeProvider.includes(provider)) // Provider not included
    continue;
  
  if (!data[provider].Certificates || data[provider].Certificates.length == 0) {
    console.info(`Provider ${provider} has no certificates`);
    continue;
  }

  // Process each certificate of provider
  for (const certficate of data[provider].Certificates) {
    // Extract certificates from acme.json
    const fullchain = Buffer.from(certficate.certificate, 'base64').toString('utf-8');
    const key = Buffer.from(certficate.key, 'base64').toString('utf-8');
    const key2 = key.replace(/RSA PRIVATE KEY-----/g,'PRIVATE KEY-----');
    
    // Fullchain processing
    const index = fullchain.indexOf('-----END CERTIFICATE-----');
    const cert = fullchain.substring(0, index + 25);
    const chain = fullchain.substring(fullchain.indexOf('-----BEGIN CERTIFICATE-----', index), fullchain.length);
    
    const domains = [];
    if (certficate.domain.main && !certficate.domain.main.trim().startsWith('*'))
      domains.push(certficate.domain.main);
    if (certficate.domain.sans)
      for (const domain of certficate.domain.sans)
        if (!domain.trim().startsWith('*'))
          domains.push(domain);

    // Save certificates for each domain
    for (const domain of domains) {
      if (argv.exclude.includes(domain)) // Exluded domains
        continue;
      if (argv.include.length > 0 && !argv.include.includes(domain)) // Not included domains
        continue;

      console.info(`${moment().format('YYYY-MM-DD HH:mm:ss')} Extracted certificates for ${domain}`);

      const domainDir = path.join(argv.directory, domain);

      // Create directory for domain
      if (!fs.existsSync(domainDir))
        fs.mkdirSync(domainDir)

      // Certificate file
      fs.writeFileSync(path.join(domainDir, 'cert.pem'), cert, { encoding: 'utf8' });

      // Chain file
      fs.writeFileSync(path.join(domainDir, 'chain.pem'), chain, { encoding: 'utf8' });

      // Full chain file
      fs.writeFileSync(path.join(domainDir, 'fullchain.pem'), fullchain, { encoding: 'utf8' });

      // Private key file (RSA PRIVATE KEY)
      fs.writeFileSync(path.join(domainDir, 'privkey.pem'), key, { encoding: 'utf8' });

      // Private key file (PRIVATE KEY)
      fs.writeFileSync(path.join(domainDir, 'privkey2.pem'), key2, { encoding: 'utf8' });
    }
  }
}

// Restart docker containers
if (argv.dockerRestart) {
  const docker = new Docker({socketPath: '/var/run/docker.sock'});
  docker.listContainers({
    filters: {
      label: {
        'tce.restart': true
      },
      status: { running: true },
    }
  }).then((info) => {
    for (const continfo of info) {
      docker.getContainer(continfo.Id).restart().then(() => {
        console.info(`Container ${continfo.Names.join(',')} restarted`);
      }).catch((error) => {
        console.log(error);
      });
    }
  }).catch((error) => {
    console.log(error);
  });
}
