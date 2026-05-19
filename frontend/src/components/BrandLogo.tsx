import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

type BrandLogoProps = {
  to?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "nav";
};

const sizeMap = {
  sm: "h-10",
  md: "h-14",
  lg: "h-16",
  xl: "h-20",
  nav: "h-11 sm:h-12",
};

export default function BrandLogo({
  to = "/",
  className = "",
  size = "md",
}: BrandLogoProps) {
  const img = (
    <img
      src={logo}
      alt="IntelliHire"
      className={`${sizeMap[size]} w-auto max-w-[220px] object-contain ${className}`}
    />
  );

  if (!to || to === "") return img;

  return (
    <Link
      to={to}
      className="inline-flex items-center shrink-0"
      title="IntelliHire"
    >
      {img}
    </Link>
  );
}
