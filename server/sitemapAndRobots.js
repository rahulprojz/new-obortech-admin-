const sm = require('sitemap');
const path = require('path');

const sitemap = sm.createSitemap({
  hostname: process.env.SITE_URL,
  cacheTime: 6000000, // 6000 sec - cache purge period
});

function setup({ server }) {
  // sitemap.add({
  //   url: '/login',
  //   changefreq: 'daily',
  //   priority: 1,
  // });

  // server.get('/sitemap.xml', (req, res) => {
  //   sitemap.toXML((err, xml) => {
  //     if (err) {
  //       res.status(500).end();
  //       return;
  //     }

  //     res.header('Content-Type', 'application/xml');
  //     res.send(xml);
  //   });
  // });

  // server.get('/robots.txt', (req, res) => {
  //   res.sendFile(path.join(__dirname, '../static', 'robots.txt'));
  // });
}

module.exports = setup;