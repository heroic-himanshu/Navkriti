import Header from "@/components/Header";
// import { PusherProvider } from "@/contexts/PusherContext";
import { PatientProvider } from "@/store/patientStore"; // import your context
import "./globals.css";
import TopLoadingBar from "@/components/TopLoadingBar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
          precedence="default"
        />
      </head>
      <body>
        <PatientProvider>
          {/* Wrap everything in the provider */}
          {/* <PusherProvider> */}
            <TopLoadingBar />
            <Header />
            <main>{children}</main>
            {/* <Footer /> */}
          {/* </PusherProvider> */}
        </PatientProvider>
      </body>
    </html>
  );
}
