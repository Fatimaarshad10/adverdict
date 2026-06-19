import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="container" style={{ paddingTop: 70, paddingBottom: 80 }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <Link href="/" className="brand" style={{ justifyContent: "center" }}>
          <span className="dot">A</span> AdVerdict
        </Link>
      </div>
      <AuthForm mode="signup" />
    </main>
  );
}
