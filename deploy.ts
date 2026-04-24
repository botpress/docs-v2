import { connect } from '@dagger.io/dagger'
import * as dotenv from '@dotenvx/dotenvx'
import * as dab from '@botpress-private/dab'

dotenv.config()

const env = {
  string(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error('Missing env var ' + name)
    return value
  },
}

async function main(): Promise<void> {
  const deployConfig = await import('./dab.config.js')

  console.log(deployConfig)

  process.exit(0)

  await connect(
    async (client) => {
      const src = client.host().directory('.', {
        exclude: ['node_modules', '.git', 'dist', '.env', '.env.production'],
      })

      const build = await client
        .container()
        .from('node:22-alpine')
        .withMountedDirectory('/app', src)
        .withWorkdir('/app')
        .withExec(['npm', 'ci'])
        .withExec(['npm', 'run', 'build'])
        .sync()

      const cloudflareApiToken = client.setSecret('CLOUDFLARE_API_TOKEN', env.string('CLOUDFLARE_API_TOKEN'))
      const cloudflareAccountId = client.setSecret('CLOUDFLARE_ACCOUNT_ID', env.string('CLOUDFLARE_ACCOUNT_ID'))
      const workerName = 'refresh-translations'

      const prodSecrets = client.host().file('.env.production', {
        noCache: true,
      })

      const deploy = await client
        .container()
        .from('node:22-slim')
        .withExec(['npm', 'install', '-g', 'wrangler'])
        .withDirectory('/dist', build.directory('/app/dist'))
        .withWorkdir('/dist')
        .withSecretVariable('CLOUDFLARE_API_TOKEN', cloudflareApiToken)
        .withSecretVariable('CLOUDFLARE_ACCOUNT_ID', cloudflareAccountId)
        // TODO I don't think this is safe at all...
        .withFile('.env.production', prodSecrets)
        .withExec([
          'wrangler',
          'deploy',
          '/dist/index.mjs',
          '--compatibility-date',
          '2026-04-20',
          '--name',
          workerName,
          '--no-bundle',
          '--secrets-file',
          '.env.production',
        ])
        .sync()

      console.log(await deploy.combinedOutput())
    },
    {
      LogOutput: process.stdout,
    }
  )
}

const complete = () => {
  console.log('done')
}

const onError = (err: unknown) => {
  console.error(err)
}

main().then(complete, onError)
