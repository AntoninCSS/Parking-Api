const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.registerUser(email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error); // inchangé
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

    // Refresh token → cookie httpOnly
    res.cookie('refreshToken', refreshToken, authService.refreshCookieOptions);

    // Access token → body JSON
    res.status(200).json({ token: accessToken, user });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ token: accessToken });
  } catch (error) {
    // Cookie invalide → on le supprime avant de passer à l'errorHandler
    res.clearCookie('refreshToken', authService.refreshCookieOptions);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logoutUser(refreshToken, req.user?.userId);
    res.clearCookie('refreshToken', authService.refreshCookieOptions);
    res.status(200).json({ message: 'Déconnecté' });
  } catch (error) {
    next(error);
  }
};