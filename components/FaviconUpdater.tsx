"use client";

import { useEffect } from "react";
import { useLogo } from "@/context/LogoContext";

export default function FaviconUpdater() {
  const { logoUrl } = useLogo();

  useEffect(() => {
    if (logoUrl) {
      // Update favicon
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = logoUrl;
      } else {
        // Create favicon link if it doesn't exist
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = logoUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [logoUrl]);

  return null;
}
