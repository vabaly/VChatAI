import { type AppType } from "next/app";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "~/styles/globals.css";

const VChatApp: AppType = ({
  Component,
  pageProps: { ...pageProps },
}) => {
  return (
    <MantineProvider>
      <Component {...pageProps} />
    </MantineProvider>
  );
};

export default VChatApp;
