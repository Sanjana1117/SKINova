import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// ─────────────────────────────────────────────────────────────────
// SCREEN 1 — Splash / Welcome
// ─────────────────────────────────────────────────────────────────
class SplashScreen extends StatelessWidget {
  final VoidCallback onGetStarted;
  const SplashScreen({super.key, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brown,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Logo mark
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.terracotta,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.spa_outlined, color: AppColors.cream, size: 40),
              ),

              const SizedBox(height: 24),

              // Brand name
              Text(
                'skinova',
                style: AppTextStyles.displayLarge.copyWith(
                  color: AppColors.cream,
                  fontSize: 52,
                  fontWeight: FontWeight.w300,
                  letterSpacing: 6,
                ),
              ),

              const SizedBox(height: 12),

              Text(
                'Where Deep Learning\nMeets Deep Health',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.sand,
                  fontSize: 15,
                  height: 1.7,
                  letterSpacing: 0.5,
                ),
              ),

              const Spacer(flex: 2),

              // Illustration placeholder - skin glow rings
              SizedBox(
                height: 220,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer glow rings
                    for (int i = 3; i >= 1; i--)
                      Container(
                        width: 60.0 * i + 60,
                        height: 60.0 * i + 60,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.terracotta.withOpacity(0.08 * i),
                            width: 1.5,
                          ),
                        ),
                      ),
                    // Center face icon
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.terracotta.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.face_retouching_natural,
                        color: AppColors.peach,
                        size: 52,
                      ),
                    ),
                    // Floating data chips
                    Positioned(
                      top: 20,
                      right: 20,
                      child: _FloatingChip(label: 'AI Powered', icon: Icons.auto_awesome),
                    ),
                    Positioned(
                      bottom: 30,
                      left: 10,
                      child: _FloatingChip(label: '3-Day Forecast', icon: Icons.timeline),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // CTA
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onGetStarted,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.terracotta,
                    foregroundColor: AppColors.warmWhite,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    elevation: 0,
                  ),
                  child: Text(
                    'Get Started',
                    style: AppTextStyles.labelBold.copyWith(
                      color: AppColors.warmWhite,
                      fontSize: 16,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              GestureDetector(
                onTap: onGetStarted,
                child: Text(
                  'Already have an account? Sign in',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.sand,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.sand,
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingChip extends StatelessWidget {
  final String label;
  final IconData icon;
  const _FloatingChip({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.brown.withOpacity(0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.terracotta.withOpacity(0.5), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.goldenLight, size: 12),
          const SizedBox(width: 5),
          Text(label,
              style: AppTextStyles.caption.copyWith(
                color: AppColors.sand,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 2 — Sign Up
// ─────────────────────────────────────────────────────────────────
class SignUpScreen extends StatefulWidget {
  final VoidCallback onNext;
  const SignUpScreen({super.key, required this.onNext});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.sand,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.brown, size: 16),
              ),
              const SizedBox(height: 28),

              Text('Create your\naccount', style: AppTextStyles.displayMedium),
              const SizedBox(height: 8),
              Text(
                'Your personalized skin journey starts here.',
                style: AppTextStyles.bodyMedium,
              ),

              const SizedBox(height: 36),

              // Form fields
              _InputField(label: 'Full Name', hint: 'e.g. Aisha Kapoor', icon: Icons.person_outline_rounded),
              const SizedBox(height: 16),
              _InputField(label: 'Email', hint: 'you@example.com', icon: Icons.mail_outline_rounded, keyboard: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _PasswordField(
                obscure: _obscurePassword,
                onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
              ),

              const SizedBox(height: 28),

              // Terms
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    margin: const EdgeInsets.only(top: 1),
                    decoration: BoxDecoration(
                      color: AppColors.terracotta,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.check, color: Colors.white, size: 13),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: AppTextStyles.bodySmall,
                        children: [
                          const TextSpan(text: 'I agree to the '),
                          TextSpan(
                            text: 'Terms of Service',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.terracotta,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.terracotta,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const TextSpan(text: '. Your biometric photos are processed and deleted — only scores are retained.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onNext,
                  child: const Text('Continue'),
                ),
              ),

              const SizedBox(height: 20),

              // Social sign in divider
              Row(
                children: [
                  Expanded(child: Divider(color: AppColors.sand, thickness: 1)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('or continue with', style: AppTextStyles.caption),
                  ),
                  Expanded(child: Divider(color: AppColors.sand, thickness: 1)),
                ],
              ),

              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(child: _SocialBtn(label: 'Google', icon: Icons.g_mobiledata_rounded)),
                  const SizedBox(width: 12),
                  Expanded(child: _SocialBtn(label: 'Apple', icon: Icons.apple_rounded)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType? keyboard;

  const _InputField({required this.label, required this.hint, required this.icon, this.keyboard});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.labelBold),
        const SizedBox(height: 8),
        TextField(
          keyboardType: keyboard,
          style: AppTextStyles.bodyLarge.copyWith(fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTextStyles.bodySmall,
            prefixIcon: Icon(icon, color: AppColors.mutedBrown, size: 20),
            filled: true,
            fillColor: AppColors.cardBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppColors.sand, width: 1.5),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppColors.sand, width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.terracotta, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _PasswordField extends StatelessWidget {
  final bool obscure;
  final VoidCallback onToggle;
  const _PasswordField({required this.obscure, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Password', style: AppTextStyles.labelBold),
        const SizedBox(height: 8),
        TextField(
          obscureText: obscure,
          style: AppTextStyles.bodyLarge.copyWith(fontSize: 15),
          decoration: InputDecoration(
            hintText: 'At least 8 characters',
            hintStyle: AppTextStyles.bodySmall,
            prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.mutedBrown, size: 20),
            suffixIcon: GestureDetector(
              onTap: onToggle,
              child: Icon(
                obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: AppColors.mutedBrown,
                size: 20,
              ),
            ),
            filled: true,
            fillColor: AppColors.cardBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.sand)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.sand, width: 1.5)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.terracotta, width: 1.5)),
          ),
        ),
      ],
    );
  }
}

class _SocialBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  const _SocialBtn({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.sand, width: 1.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.brown, size: 20),
          const SizedBox(width: 8),
          Text(label, style: AppTextStyles.labelBold),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 3 — Profile Setup (skin type, gender, allergies)
// ─────────────────────────────────────────────────────────────────
class ProfileSetupScreen extends StatefulWidget {
  final VoidCallback onNext;
  const ProfileSetupScreen({super.key, required this.onNext});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  String? _selectedGender;
  String? _selectedSkinType;
  final Set<String> _allergies = {};

  final List<String> _skinTypes = ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'];
  final List<String> _allergyOptions = ['Dairy', 'Gluten', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Sugar'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(28, 24, 28, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress indicator
              Row(
                children: List.generate(4, (i) => Expanded(
                  child: Container(
                    height: 3,
                    margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                    decoration: BoxDecoration(
                      color: i < 2 ? AppColors.terracotta : AppColors.sand,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                )),
              ),
              const SizedBox(height: 28),

              Text('Tell us about\nyourself', style: AppTextStyles.displayMedium),
              const SizedBox(height: 6),
              Text('This helps Skinova personalise your AI model.', style: AppTextStyles.bodyMedium),

              const SizedBox(height: 32),

              // Age & Height row
              Row(
                children: [
                  Expanded(child: _InputField(label: 'Age', hint: 'e.g. 24', icon: Icons.cake_outlined, keyboard: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _InputField(label: 'Height (cm)', hint: '165', icon: Icons.straighten_outlined, keyboard: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _InputField(label: 'Weight (kg)', hint: '60', icon: Icons.monitor_weight_outlined, keyboard: TextInputType.number)),
                ],
              ),

              const SizedBox(height: 24),

              // Gender
              Text('Biological Sex', style: AppTextStyles.labelBold),
              const SizedBox(height: 10),
              Row(
                children: ['Female', 'Male', 'Prefer not to say'].map((g) {
                  final selected = _selectedGender == g;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedGender = g),
                      child: Container(
                        margin: EdgeInsets.only(right: g != 'Prefer not to say' ? 8 : 0),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.terracotta : AppColors.cardBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected ? AppColors.terracotta : AppColors.sand,
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              g == 'Female' ? Icons.female_rounded : g == 'Male' ? Icons.male_rounded : Icons.person_outline,
                              color: selected ? AppColors.warmWhite : AppColors.mutedBrown,
                              size: 22,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              g == 'Prefer not to say' ? 'Other' : g,
                              style: AppTextStyles.caption.copyWith(
                                color: selected ? AppColors.warmWhite : AppColors.brown,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              if (_selectedGender == 'Female') ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.lavender.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.lavenderDeep.withOpacity(0.3), width: 1),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.water_drop_outlined, color: AppColors.lavenderDeep, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Hormonal cycle tracking will be enabled — this lets Skinova detect cycle-phase skin triggers.',
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.lavenderDeep, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Skin type
              Text('Skin Type', style: AppTextStyles.labelBold),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _skinTypes.map((s) {
                  final selected = _selectedSkinType == s;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedSkinType = s),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.moss : AppColors.cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: selected ? AppColors.moss : AppColors.sand,
                          width: 1.5,
                        ),
                      ),
                      child: Text(
                        s,
                        style: AppTextStyles.labelBold.copyWith(
                          color: selected ? AppColors.warmWhite : AppColors.brown,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),

              // Food sensitivities
              Text('Food Sensitivities', style: AppTextStyles.labelBold),
              const SizedBox(height: 4),
              Text('Select all that apply', style: AppTextStyles.bodySmall),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _allergyOptions.map((a) {
                  final selected = _allergies.contains(a);
                  return GestureDetector(
                    onTap: () => setState(() {
                      selected ? _allergies.remove(a) : _allergies.add(a);
                    }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.terracottaLight.withOpacity(0.15) : AppColors.cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: selected ? AppColors.terracotta : AppColors.sand,
                          width: 1.5,
                        ),
                      ),
                      child: Text(
                        a,
                        style: AppTextStyles.labelBold.copyWith(
                          color: selected ? AppColors.terracotta : AppColors.brown,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 36),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onNext,
                  child: const Text('Continue'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SCREEN 4 — Skincare Product Registration
// ─────────────────────────────────────────────────────────────────
class ProductRegistrationScreen extends StatelessWidget {
  final VoidCallback onNext;
  const ProductRegistrationScreen({super.key, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final products = [
      _ProductData('CeraVe Moisturising Cream', 'Moisturizer', 2, 'Low comedogenic risk'),
      _ProductData('The Ordinary Niacinamide 10%', 'Serum', 0, 'Non-comedogenic'),
      _ProductData('Neutrogena Hydro Boost SPF 30', 'Sunscreen', 3, 'Moderate — watch for pores'),
    ];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(28, 24, 28, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: List.generate(4, (i) => Expanded(
                  child: Container(
                    height: 3,
                    margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                    decoration: BoxDecoration(
                      color: i < 3 ? AppColors.terracotta : AppColors.sand,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                )),
              ),
              const SizedBox(height: 28),

              Text('Your skincare\nproducts', style: AppTextStyles.displayMedium),
              const SizedBox(height: 8),
              Text('Photograph each product once. We\'ll analyse ingredients automatically.', style: AppTextStyles.bodyMedium),

              const SizedBox(height: 28),

              // Add product button
              GestureDetector(
                onTap: () {},
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppColors.terracotta,
                      width: 1.5,
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.camera_alt_outlined, color: AppColors.terracotta, size: 22),
                      const SizedBox(width: 10),
                      Text('Photograph a Product',
                          style: AppTextStyles.labelBold.copyWith(color: AppColors.terracotta)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 8),
              Center(
                child: Text('Or enter a barcode / product name manually',
                    style: AppTextStyles.caption),
              ),

              const SizedBox(height: 24),

              Text('Registered Products (${products.length})', style: AppTextStyles.headingMedium),
              const SizedBox(height: 12),

              Expanded(
                child: ListView.separated(
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _ProductCard(data: products[i]),
                ),
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onNext,
                  child: const Text('Start My Skin Journey'),
                ),
              ),

              const SizedBox(height: 12),

              Center(
                child: Text(
                  'You can add more products anytime from your profile.',
                  style: AppTextStyles.caption,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductData {
  final String name;
  final String type;
  final int comedogenicScore;
  final String note;
  _ProductData(this.name, this.type, this.comedogenicScore, this.note);
}

class _ProductCard extends StatelessWidget {
  final _ProductData data;
  const _ProductCard({required this.data});

  Color get _riskColor {
    if (data.comedogenicScore <= 1) return AppColors.riskLow;
    if (data.comedogenicScore <= 2) return AppColors.riskMid;
    if (data.comedogenicScore <= 3) return AppColors.riskHigh;
    return AppColors.riskCritical;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: AppColors.brown.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.sand,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.spa_outlined, color: AppColors.dusk, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.name,
                    style: AppTextStyles.labelBold,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(data.type, style: AppTextStyles.bodySmall),
                const SizedBox(height: 4),
                Text(data.note,
                    style: AppTextStyles.caption.copyWith(color: _riskColor, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          // Comedogenic dots
          Column(
            children: [
              Text('Pore Risk', style: AppTextStyles.caption),
              const SizedBox(height: 4),
              Row(
                children: List.generate(5, (i) => Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(right: 2),
                  decoration: BoxDecoration(
                    color: i < data.comedogenicScore ? _riskColor : AppColors.sand,
                    shape: BoxShape.circle,
                  ),
                )),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
