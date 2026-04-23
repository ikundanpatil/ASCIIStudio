export default (req, res) => {
  // Serve client assets
  if (req.url && req.url.startsWith("/assets/")) {
    res.status(404).send("Not Found");
    return;
  }

  // For now, send a basic HTML page
  // TODO: Integrate with TanStack Start server rendering
  res.status(200).setHeader("Content-Type", "text/html").send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ASCII Studio</title>
      <link rel="stylesheet" href="/assets/styles-CNPFDIEV.css">
    </head>
    <body>
      <div id="root"></div>
      <script src="/assets/index-Cfn8ySwo.js"></script>
      <script src="/assets/index-BxhjPixE.js"></script>
    </body>
    </html>
  `);
};
