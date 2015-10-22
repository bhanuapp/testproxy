var config = {};

config.folder = {};
config.cors = {};
config.token = {};

//domain
config.protocol = "https";
config.domain = "integrations.cudasign.com";

//folders
config.folder.upload = "/var/www/data/uploads/";
config.folder.output = "/var/www/data/output/";

//cors
config.cors.whitelist = ["crm.dynamics.com","netsuite.com","service-now.com"];
config.cors.options = {
  allowedHeaders: 'Content-Type, Accept, X-Requested-With, Authorization, Auth'
};

//tokens
config.token.msdynamics = "MGJjZGQzOGIwOGRkZTZlMzNiMWMzNmZjN2I0MzVkZjQ6NzcyOWM0Mzg1ODFhNjVkYTg0NjVjMzI2MDNiYzdlZTc=";

module.exports = config;
