import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AdVerdict logo" className="brand-logo" />
          AdVerdict
        </Link>
        <div className="nav-links">
          <Link href="/#how" className="hide-sm">
            How it works
          </Link>
          <Link href="/#agents" className="hide-sm">
            The agents
          </Link>
          <Link href="/#today" className="hide-sm">
            Live verdicts
          </Link>
          <Link href="/reviews" className="hide-sm">
            All verdicts
          </Link>
          <Link href="/review" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: 14 }}>
            Run a review
          </Link>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
