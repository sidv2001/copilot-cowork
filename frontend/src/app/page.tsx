export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-sans text-zinc-100">
      <main className="flex w-full max-w-2xl flex-col items-center gap-12 px-8 py-24">
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold">
            CC
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Copilot Cowork
          </h1>
          <p className="max-w-md text-lg text-zinc-400">
            Your AI-powered collaborative workspace. Built with{" "}
            <a
              href="https://blackboard.sh/electrobun/docs/"
              className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Electrobun
            </a>{" "}
            +{" "}
            <a
              href="https://nextjs.org"
              className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
