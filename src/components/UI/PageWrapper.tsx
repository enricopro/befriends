import Header from "@/components/UI/Header";

type PageWrapperProps = {
  children: React.ReactNode;
  title?: string;
};

const PageWrapper = ({ children, title }: PageWrapperProps) => {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Header />
      <main className="flex flex-col items-center px-4 py-6 flex-grow">
        {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
};

export default PageWrapper;
