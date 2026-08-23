"use client";

import { Page } from "@/types";
import CatalogPage from "../pages/CatalogPage";
import App from "../components/App";

export default function Home() {
  return <App />;
} 

// export default function Home() {
//   return <CatalogPage navigate={function (page: Page, data?: Record<string, string>): void {
//     throw new Error("Function not implemented.");
//   } } />;
// }