import "./work.css";
import { workPageTitle } from "./data";

// Applies to every /work route. No `robots` here any more: the section was
// noindex'd while it sat behind a password, and it is public now.
export const metadata = {
  title: workPageTitle("Work"),
};

export default function WorkLayout({ children }) {
  return <div className="work-root">{children}</div>;
}
