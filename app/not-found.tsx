import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-32 text-center space-y-4">
      <div className="font-mono text-cyan text-6xl">404</div>
      <p className="text-dim">Signal lost. That page isn&apos;t in the index.</p>
      <Link href="/" className="text-cyan hover:underline">Return to base →</Link>
    </div>
  );
}
