const dbConfig = require("../db.config")
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER,
    dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operationsAliases: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    },
    logging: false
})

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./users.model.js")(sequelize, Sequelize);
db.email = require("./email.model.js")(sequelize, Sequelize);
db.phone_number = require("./phone_number.model")(sequelize, Sequelize);
db.tournaments = require("./tournaments.model")(sequelize, Sequelize);
db.permissions = require("./permissions.model")(sequelize, Sequelize);
db.role = require("./role.model")(sequelize, Sequelize);
db.tournament_permission = require("./tour_perm.model")(sequelize, Sequelize);
db.match = require("./match.model")(sequelize, Sequelize);
db.set = require("./set.model")(sequelize, Sequelize);

// one to many relationship
sequelize.models.users.hasMany(sequelize.models.emails, {
    foreignKey: "user_id",
    onDelete: "restrict",
    onUpdate: "restrict"
});
sequelize.models.users.hasMany(sequelize.models.phone_numbers, {
    foreignKey: "user_id",
    onDelete: "restrict",
    onUpdate: "restrict"
});
sequelize.models.users.hasMany(sequelize.models.tournaments, {
    foreignKey: "created_by",
    onDelete: "restrict",
    onUpdate: "restrict"
});

sequelize.models.users.hasMany(sequelize.models.tournament_permission, {
    foreignKey: "user_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})
sequelize.models.tournaments.hasMany(sequelize.models.tournament_permission, {
    foreignKey: "tour_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})

sequelize.models.tournaments.hasMany(sequelize.models.matches, {
    foreignKey: "tour_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})
sequelize.models.matches.hasMany(sequelize.models.sets, {
    foreignKey: "match_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})
sequelize.models.permissions.hasMany(sequelize.models.roles, {
    foreignKey: "permission_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})
sequelize.models.tournament_permission.hasMany(sequelize.models.roles, {
    foreignKey: "role_id",
    onDelete: "restrict",
    onUpdate: "restrict"
})

// sequelize.models.roles.sync()

module.exports = db;

