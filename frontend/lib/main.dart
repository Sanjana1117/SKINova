import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding_screens.dart';
import 'screens/dashboard_screens.dart';
import 'screens/food_logging_screen.dart';
import 'screens/forecast_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(const SkiNovaApp());
}

class SkiNovaApp extends StatelessWidget {
  const SkiNovaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Skinova',
      theme: AppTheme.theme,
      debugShowCheckedModeBanner: false,
      home: const AppNavigator(),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// App Navigator — manages screen flow
// ─────────────────────────────────────────────────────────────────
class AppNavigator extends StatefulWidget {
  const AppNavigator({super.key});

  @override
  State<AppNavigator> createState() => _AppNavigatorState();
}

enum AppScreen {
  splash,
  signup,
  profileSetup,
  productRegistration,
  femaleDashboard,
  maleDashboard,
  foodLog,
  forecast,
}

class _AppNavigatorState extends State<AppNavigator> {
  AppScreen _screen = AppScreen.splash;
  bool _isFemale = true;
  AppScreen _dashboardScreen = AppScreen.femaleDashboard;

  void _go(AppScreen screen) => setState(() => _screen = screen);

  @override
  Widget build(BuildContext context) {
    switch (_screen) {

      case AppScreen.splash:
        return SplashScreen(onGetStarted: () => _go(AppScreen.signup));

      case AppScreen.signup:
        return SignUpScreen(onNext: () => _go(AppScreen.profileSetup));

      case AppScreen.profileSetup:
        return ProfileSetupScreen(onNext: () => _go(AppScreen.productRegistration));

      case AppScreen.productRegistration:
        return ProductRegistrationScreen(
          onNext: () {
            // Demo: go to female dashboard. In production, read from profile.
            setState(() {
              _isFemale = true;
              _dashboardScreen = AppScreen.femaleDashboard;
              _screen = AppScreen.femaleDashboard;
            });
          },
        );

      case AppScreen.femaleDashboard:
        return FemaleDashboardScreen(
          onForecastTap: () => _go(AppScreen.forecast),
          onFoodTap: () => _go(AppScreen.foodLog),
        );

      case AppScreen.maleDashboard:
        return MaleDashboardScreen(
          onForecastTap: () => _go(AppScreen.forecast),
          onFoodTap: () => _go(AppScreen.foodLog),
        );

      case AppScreen.foodLog:
        return FoodLoggingScreen(
          onBack: () => _go(_dashboardScreen),
        );

      case AppScreen.forecast:
        return ForecastScreen(
          onBack: () => _go(_dashboardScreen),
          isFemale: _isFemale,
        );
    }
  }
}
