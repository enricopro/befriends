import Header from "@/components/UI/Header";
import { useEffect, useState } from "react";

type PageWrapperProps = {
  children: React.ReactNode;
  title?: string;
};

const PageWrapper = ({ children, title }: PageWrapperProps) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|mobile/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <img src="/logo.png" alt="BeFriends" className="h-12 mb-6" />
        <img
          src="/desktop_error_image.png"
          alt="Mobile only"
          className="w-64 h-auto mb-6"
        />
        <h1 className="text-2xl font-bold">Oops!</h1>
        <p className="text-zinc-400 mt-2">
          BeFriends is only available on mobile. Come back from your phone!
        </p>
      </div>
    );
  }

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
