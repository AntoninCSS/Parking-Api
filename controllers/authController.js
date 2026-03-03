const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const con = require("../config/db.js");

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({ message: "Email et mot de passe requis" });
    }
    if (password.length < 12) {
      return res
        .status(404)
        .json({ message: "Mot de passe trop court (12 caractères minimum" });
    }
    //Vérification si l'email est deja utilisé
    const existing = await con.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await con.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
      [email, password_hash],
    );
    const user = result.rows;

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({ message: "Email et mot de passe requis" });
    }
    const resutat = await con.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (resutat.rows.length === 0) {
      return res.status(409).json({ message: "Identifiants invalides" });
    }
    const user = resutat.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
};
