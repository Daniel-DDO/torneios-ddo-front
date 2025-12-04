import { useEffect, useState } from "react";
import "./LoadingSpinner.css";

interface Props {
  isLoading: boolean;
}

export default function LoadingSpinner({ isLoading }: Props) {
  const [render, setRender] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setRender(true);
    } else {
      const timeout = setTimeout(() => setRender(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!render) return null;

  return (
    <div className={`loading-layer ${isLoading ? "fade-in" : "fade-out"}`}>
      <div className="loader-track">
        <div className="loader-bar"></div>
      </div>
    </div>
  );
}
