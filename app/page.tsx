import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">UAffiliated</h1>
        <p className="text-xl text-slate-300 mb-8">
          Affiliate Network System
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
