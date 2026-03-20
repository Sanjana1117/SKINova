import 'package:flutter/material.dart';

class AppColors {
  // Warm organic palette
  static const Color cream = Color(0xFFF6F0E6);
  static const Color sand = Color(0xFFEAE0CC);
  static const Color warmWhite = Color(0xFFFAF7F2);
  static const Color bg = Color(0xFFF8F3EC);

  static const Color terracotta = Color(0xFFC4714A);
  static const Color terracottaLight = Color(0xFFD4896A);
  static const Color clay = Color(0xFF9A5535);

  static const Color moss = Color(0xFF6E8A52);
  static const Color mossLight = Color(0xFF95B070);

  static const Color dusk = Color(0xFF8B6E5A);
  static const Color brown = Color(0xFF3D2B1F);
  static const Color mutedBrown = Color(0xFF8A7060);

  static const Color peach = Color(0xFFEFB99A);
  static const Color rose = Color(0xFFE8A888);

  static const Color lavender = Color(0xFFD8CEEA);
  static const Color lavenderDeep = Color(0xFFAA96C8);
  static const Color lavenderLight = Color(0xFFEDE8F5);

  static const Color golden = Color(0xFFC8A050);
  static const Color goldenLight = Color(0xFFDDB96A);

  static const Color riskLow = Color(0xFF95B070);
  static const Color riskMid = Color(0xFFDDB96A);
  static const Color riskHigh = Color(0xFFC4714A);
  static const Color riskCritical = Color(0xFF9A5535);

  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color cardBg2 = Color(0xFFFDF9F5);
}

class AppTheme {
  static ThemeData get theme => ThemeData(
        fontFamily: 'DMSans',
        scaffoldBackgroundColor: AppColors.bg,
        colorScheme: const ColorScheme.light(
          primary: AppColors.terracotta,
          secondary: AppColors.moss,
          surface: AppColors.warmWhite,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.bg,
          elevation: 0,
          iconTheme: IconThemeData(color: AppColors.brown),
          titleTextStyle: TextStyle(
            fontFamily: 'CormorantGaramond',
            fontSize: 22,
            fontWeight: FontWeight.w600,
            color: AppColors.brown,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.terracotta,
            foregroundColor: AppColors.warmWhite,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            elevation: 0,
          ),
        ),
      );
}

class AppTextStyles {
  static const TextStyle displayLarge = TextStyle(
    fontFamily: 'CormorantGaramond',
    fontSize: 48,
    fontWeight: FontWeight.w300,
    color: AppColors.brown,
    height: 1.1,
  );

  static const TextStyle displayMedium = TextStyle(
    fontFamily: 'CormorantGaramond',
    fontSize: 36,
    fontWeight: FontWeight.w400,
    color: AppColors.brown,
    height: 1.2,
  );

  static const TextStyle headingLarge = TextStyle(
    fontFamily: 'CormorantGaramond',
    fontSize: 28,
    fontWeight: FontWeight.w600,
    color: AppColors.brown,
    height: 1.3,
  );

  static const TextStyle headingMedium = TextStyle(
    fontFamily: 'CormorantGaramond',
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: AppColors.brown,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.brown,
    height: 1.6,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.mutedBrown,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.mutedBrown,
  );

  static const TextStyle labelBold = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.brown,
    letterSpacing: 0.3,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: 'DMSans',
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: AppColors.mutedBrown,
    letterSpacing: 0.5,
  );
}
