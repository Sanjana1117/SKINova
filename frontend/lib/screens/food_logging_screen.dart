import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';

class FoodLoggingScreen extends StatefulWidget {
  final VoidCallback onBack;
  const FoodLoggingScreen({super.key, required this.onBack});

  @override
  State<FoodLoggingScreen> createState() => _FoodLoggingScreenState();
}

class _FoodLoggingScreenState extends State<FoodLoggingScreen> {
  int _selectedTab = 0; // 0 = photo, 1 = barcode, 2 = manual

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        leading: GestureDetector(
          onTap: widget.onBack,
          child: Container(
            margin: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.brown, size: 16),
          ),
        ),
        title: Text('Food Log', style: AppTextStyles.headingMedium),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.terracotta.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('Mar 8', style: AppTextStyles.labelBold.copyWith(color: AppColors.terracotta)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Daily IRS Summary ─────────────────────────────────
            _DailyIrsSummary(),

            const SizedBox(height: 20),

            // ── Log Method Tabs ───────────────────────────────────
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.sand,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _Tab(label: 'Photo', icon: Icons.camera_alt_outlined, active: _selectedTab == 0, onTap: () => setState(() => _selectedTab = 0)),
                  _Tab(label: 'Barcode', icon: Icons.qr_code_scanner, active: _selectedTab == 1, onTap: () => setState(() => _selectedTab = 1)),
                  _Tab(label: 'Manual', icon: Icons.edit_outlined, active: _selectedTab == 2, onTap: () => setState(() => _selectedTab = 2)),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Active Log Panel ──────────────────────────────────
            if (_selectedTab == 0) _PhotoLogPanel(),
            if (_selectedTab == 1) _BarcodePanel(),
            if (_selectedTab == 2) _ManualEntryPanel(),

            const SizedBox(height: 24),

            // ── Today's Breakdown ─────────────────────────────────
            SectionHeader(title: "Today's Breakdown"),
            const SizedBox(height: 12),

            // Macronutrient summary
            _NutrientSummaryRow(),
            const SizedBox(height: 16),

            // Flag summary
            _FlagSummarySection(),
            const SizedBox(height: 16),

            // Food items
            Text('Logged Meals', style: AppTextStyles.headingMedium),
            const SizedBox(height: 12),
            FoodLogItem(
              name: 'Oats with Banana',
              time: '8:12 AM',
              score: 1,
              scoreColor: AppColors.riskLow,
              details: 'Low GI · High fiber · Omega-3',
            ),
            FoodLogItem(
              name: 'Masala Chai with Milk',
              time: '10:45 AM',
              score: 4,
              scoreColor: AppColors.riskHigh,
              details: 'Dairy detected · Allergen match ×1.4',
            ),
            FoodLogItem(
              name: 'Dal Rice with Sabzi',
              time: '1:30 PM',
              score: 2,
              scoreColor: AppColors.riskLow,
              details: 'Turmeric detected · Anti-inflammatory',
            ),

            const SizedBox(height: 20),

            // ── Ingredient Alert ──────────────────────────────────
            _IngredientAlertCard(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: AppColors.terracotta,
        foregroundColor: AppColors.warmWhite,
        elevation: 4,
        label: Text('Log a Meal', style: AppTextStyles.labelBold.copyWith(color: AppColors.warmWhite)),
        icon: const Icon(Icons.add_a_photo_outlined, size: 20),
      ),
    );
  }
}

// ── Daily IRS Summary card ───────────────────────────────────────
class _DailyIrsSummary extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.brown.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Today's Inflammatory Risk", style: AppTextStyles.bodySmall),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('3.8', style: AppTextStyles.headingLarge.copyWith(color: AppColors.riskMid, fontSize: 36)),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6, left: 4),
                      child: Text('/ 10', style: AppTextStyles.bodySmall),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                RiskBadge(label: 'MODERATE', color: AppColors.riskMid),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            children: [
              _MiniStat(label: 'Meals', value: '3'),
              const SizedBox(height: 10),
              _MiniStat(label: 'Flags', value: '2'),
              const SizedBox(height: 10),
              _MiniStat(label: 'Allergens', value: '1'),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  const _MiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: AppTextStyles.headingMedium.copyWith(fontSize: 18)),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}

// ── Tab widget ───────────────────────────────────────────────────
class _Tab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  const _Tab({required this.label, required this.icon, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppColors.cardBg : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: active
                ? [BoxShadow(color: AppColors.brown.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))]
                : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: active ? AppColors.terracotta : AppColors.mutedBrown, size: 16),
              const SizedBox(width: 5),
              Text(label,
                  style: AppTextStyles.labelBold.copyWith(
                    color: active ? AppColors.terracotta : AppColors.mutedBrown,
                    fontSize: 12,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Photo log panel ──────────────────────────────────────────────
class _PhotoLogPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Camera preview placeholder
        Container(
          height: 200,
          decoration: BoxDecoration(
            color: AppColors.brown,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Stack(
            children: [
              // Viewfinder grid
              CustomPaint(size: const Size(double.infinity, 200), painter: _GridPainter()),
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.camera_alt_outlined, color: Colors.white54, size: 40),
                    const SizedBox(height: 8),
                    Text('Tap to take a food photo',
                        style: AppTextStyles.bodySmall.copyWith(color: Colors.white60)),
                  ],
                ),
              ),
              // Corner indicators
              Positioned(top: 16, left: 16, child: _CornerMark()),
              Positioned(top: 16, right: 16, child: _CornerMark(flipH: true)),
              Positioned(bottom: 16, left: 16, child: _CornerMark(flipV: true)),
              Positioned(bottom: 16, right: 16, child: _CornerMark(flipH: true, flipV: true)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text('AI will detect and classify each food item on the plate.',
            style: AppTextStyles.bodySmall, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        // Analysis result preview
        _FoodAnalysisPreview(),
      ],
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.06)
      ..strokeWidth = 0.5;
    for (int i = 1; i < 3; i++) {
      canvas.drawLine(Offset(size.width * i / 3, 0), Offset(size.width * i / 3, size.height), paint);
      canvas.drawLine(Offset(0, size.height * i / 3), Offset(size.width, size.height * i / 3), paint);
    }
  }

  @override
  bool shouldRepaint(_) => false;
}

class _CornerMark extends StatelessWidget {
  final bool flipH, flipV;
  const _CornerMark({this.flipH = false, this.flipV = false});

  @override
  Widget build(BuildContext context) {
    return Transform.flip(
      flipX: flipH,
      flipY: flipV,
      child: SizedBox(
        width: 20,
        height: 20,
        child: CustomPaint(painter: _CornerPainter()),
      ),
    );
  }
}

class _CornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = AppColors.terracotta
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(0, size.height), const Offset(0, 0), p);
    canvas.drawLine(const Offset(0, 0), Offset(size.width, 0), p);
  }

  @override
  bool shouldRepaint(_) => false;
}

class _FoodAnalysisPreview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      _DetectedFood('Dal (Lentils)', 'High protein · Low GI', AppColors.riskLow, 1),
      _DetectedFood('Basmati Rice', 'Medium GI · Refined carb', AppColors.riskMid, 3),
      _DetectedFood('Paneer', 'Dairy detected · IGF-1 risk', AppColors.riskHigh, 5),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.sand, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, color: AppColors.terracotta, size: 14),
              const SizedBox(width: 6),
              Text('AI Detected Items', style: AppTextStyles.labelBold.copyWith(color: AppColors.terracotta)),
              const Spacer(),
              Text('3 items', style: AppTextStyles.caption),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(right: 10, top: 2),
                  decoration: BoxDecoration(color: f.color, shape: BoxShape.circle),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(f.name, style: AppTextStyles.labelBold.copyWith(fontSize: 13)),
                      Text(f.detail, style: AppTextStyles.caption),
                    ],
                  ),
                ),
                // IRS dots
                Row(
                  children: List.generate(5, (i) => Container(
                    width: 6,
                    height: 6,
                    margin: const EdgeInsets.only(left: 2),
                    decoration: BoxDecoration(
                      color: i < f.irs ? f.color : AppColors.sand,
                      shape: BoxShape.circle,
                    ),
                  )),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _DetectedFood {
  final String name, detail;
  final Color color;
  final int irs;
  _DetectedFood(this.name, this.detail, this.color, this.irs);
}

// ── Barcode panel ────────────────────────────────────────────────
class _BarcodePanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: AppColors.brown,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Scan line
          Container(height: 2, color: AppColors.terracotta.withOpacity(0.7)),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.qr_code_scanner, color: Colors.white54, size: 44),
              const SizedBox(height: 8),
              Text('Point camera at barcode',
                  style: AppTextStyles.bodySmall.copyWith(color: Colors.white60)),
              const SizedBox(height: 4),
              Text('Powered by Open Food Facts API',
                  style: AppTextStyles.caption.copyWith(color: Colors.white38, fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Manual entry panel ───────────────────────────────────────────
class _ManualEntryPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.sand, width: 1),
      ),
      child: Column(
        children: [
          TextField(
            style: AppTextStyles.bodyLarge.copyWith(fontSize: 15),
            decoration: InputDecoration(
              hintText: 'Search food item...',
              hintStyle: AppTextStyles.bodySmall,
              prefixIcon: const Icon(Icons.search, color: AppColors.mutedBrown, size: 20),
              filled: true,
              fillColor: AppColors.sand.withOpacity(0.4),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 12),
          Text('Common searches:', style: AppTextStyles.caption),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: ['Idli', 'Chapati', 'Curd', 'Green Tea', 'Eggs', 'Samosa'].map((f) =>
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.sand,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(f, style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w500)),
              ),
            ).toList(),
          ),
        ],
      ),
    );
  }
}

// ── Nutrient summary row ─────────────────────────────────────────
class _NutrientSummaryRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final nutrients = [
      _Nutrient('Sugar', '28g', 0.56, AppColors.riskHigh),
      _Nutrient('Dairy', '180ml', 0.72, AppColors.riskHigh),
      _Nutrient('Fiber', '14g', 0.7, AppColors.riskLow),
      _Nutrient('Omega-3', 'Low', 0.2, AppColors.riskMid),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.brown.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Nutritional Summary', style: AppTextStyles.labelBold),
          const SizedBox(height: 12),
          Row(
            children: nutrients.map((n) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: n != nutrients.last ? 10 : 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.label, style: AppTextStyles.caption),
                    const SizedBox(height: 4),
                    Text(n.value,
                        style: AppTextStyles.labelBold.copyWith(color: n.color, fontSize: 13)),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: n.level,
                        backgroundColor: n.color.withOpacity(0.12),
                        valueColor: AlwaysStoppedAnimation(n.color),
                        minHeight: 4,
                      ),
                    ),
                  ],
                ),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _Nutrient {
  final String label, value;
  final double level;
  final Color color;
  _Nutrient(this.label, this.value, this.level, this.color);
}

// ── Flag summary ─────────────────────────────────────────────────
class _FlagSummarySection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _FlagCard(
            label: 'Pro-Inflammatory Flags',
            count: 3,
            items: ['Refined Sugar', 'Dairy ×1.4', 'Trans Fat'],
            color: AppColors.riskHigh,
            icon: Icons.warning_amber_rounded,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _FlagCard(
            label: 'Anti-Inflammatory Flags',
            count: 2,
            items: ['Turmeric', 'High Fiber'],
            color: AppColors.riskLow,
            icon: Icons.check_circle_outline_rounded,
          ),
        ),
      ],
    );
  }
}

class _FlagCard extends StatelessWidget {
  final String label;
  final int count;
  final List<String> items;
  final Color color;
  final IconData icon;
  const _FlagCard({required this.label, required this.count, required this.items, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.25), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: color, size: 14),
            const SizedBox(width: 5),
            Text('$count flags', style: AppTextStyles.caption.copyWith(color: color, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 6),
          Text(label, style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          ...items.map((i) => Padding(
            padding: const EdgeInsets.only(bottom: 3),
            child: Text('· $i', style: AppTextStyles.caption.copyWith(color: color)),
          )),
        ],
      ),
    );
  }
}

// ── Ingredient alert card ────────────────────────────────────────
class _IngredientAlertCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.riskHigh.withOpacity(0.07),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.riskHigh.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: AppColors.riskHigh, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Allergen Match Detected',
                    style: AppTextStyles.labelBold.copyWith(color: AppColors.riskHigh)),
                const SizedBox(height: 3),
                Text(
                  'Dairy detected in today\'s meals. Your profile flags dairy as a skin sensitivity — IRS score multiplied by 1.4×.',
                  style: AppTextStyles.bodySmall.copyWith(height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
