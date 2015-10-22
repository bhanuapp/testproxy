var config = {};

config.folder = {};
config.cors = {};
config.token = {};

//domain
config.protocol = "http";
config.domain = "localhost:3000";

//folders
config.folder.upload = "./uploads/";
config.folder.output = "./output/";

//cors
config.cors.whitelist = ["localhost:3000","localhost:57826", "crm.dynamics.com", "netsuite.com","service-now.com","infusionsoft.com","sharepoint.com"];
config.cors.options = {
  allowedHeaders: 'Content-Type, Accept, X-Requested-With, Authorization, Auth'
};

//tokens
config.token.msdynamics = "MGJjZGQzOGIwOGRkZTZlMzNiMWMzNmZjN2I0MzVkZjQ6NzcyOWM0Mzg1ODFhNjVkYTg0NjVjMzI2MDNiYzdlZTc=";

module.exports = config;
