import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface Props {
  children: ReactNode;
}

function MainLayout({ children }: Props) {
  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">

        <Header />

        <main className="p-6">
          {children}
        </main>

      </div>

    </div>
  );
}

export default MainLayout;