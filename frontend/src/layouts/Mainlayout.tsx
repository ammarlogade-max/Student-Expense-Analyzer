import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold text-gray-800">
          ExpenseIQ
        </h1>
      </header>

      <main className="p-4">{children}</main>
    </div>
  );
};

export default MainLayout;
