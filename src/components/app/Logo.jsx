import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-1 select-none">
      <span className="text-xl font-semibold tracking-tight">
        <span className="text-[#E11D48]">HUST</span>
        <span className="text-[#0F172A]">emy</span>
      </span>
    </Link>
  );
}
