"use client";
import { useEffect } from "react";

interface ZoomSetterProps {
  zoom?: number;
}

const ZoomSetter: React.FC<ZoomSetterProps> = ({ zoom = 1 }) => {
  useEffect(() => {
    document.body.style.zoom = String(zoom);
    return () => {
      document.body.style.zoom = "1";
    };
  }, [zoom]);
  return null;
};

export default ZoomSetter;
