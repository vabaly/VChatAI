import Head from "next/head";

export function Meta() {
  const title = "VChat";
  const description = "Voice chat with VRoid characters";
  const keywords = "voice, chat, characters";

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
