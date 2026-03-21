import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { config } from './index';
import { userRepository } from '@repositories/user.repository';
import { TokenType } from '@models/token.model';

const jwtOptions: StrategyOptions = {
  secretOrKey: config.jwt.accessSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      if (payload.type !== TokenType.ACCESS) {
        return done(null, false);
      }
      const user = await userRepository.findById(payload.sub);
      if (!user || !user.is_active) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }),
);

export { passport };
