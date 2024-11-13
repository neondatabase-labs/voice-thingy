import Link from 'next/link'

export default function () {
  return (
    <header className="border-b py-1 flex flex-col items-center px-8">
      <div className="w-full flex flex-row items-center justify-between max-w-7xl">
        <Link href="/">
          <span className="text-purple-600">Voice</span>Thingy
        </Link>
        <a target="_blank" href="https://github.com/neondatabase-labs/voice-thingy">
          <span className="text-sm">GitHub Repo</span>
        </a>
      </div>
    </header>
  )
}
