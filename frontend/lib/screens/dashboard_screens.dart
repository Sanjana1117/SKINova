import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';

// ─────────────────────────────────────────────────────────────────
// FEMALE DASHBOARD
// ─────────────────────────────────────────────────────────────────
class FemaleDashboardScreen extends StatefulWidget {
  final VoidCallback onForecastTap;
  final VoidCallback onFoodTap;
  const FemaleDashboardScreen({super.key, required this.onForecastTap, required this.onFoodTap});

  @override
  State<FemaleDashboardScreen> createState() => _FemaleDashboardScreenState();
}

class _FemaleDashboardScreenState extends State<FemaleDashboardScreen> {
  int _navIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: SkiNovaAppBar(greeting: 'Good morning,', name: 'Aisha'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Today's Skin Snapshot ─────────────────────────────
            _SkinSnapshotCard(isFemale: true, onForecastTap: widget.onForecastTap),

            const SizedBox(height: 20),

            // ── Key Stats Row ─────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    label: 'Skin Score',
                    value: '74',
                    subtitle: '↑ 6 from yesterday',
                    accentColor: AppColors.moss,
                    icon: Icons.face_retouching_natural,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    label: 'Inflammatory\nRisk Score',
                    value: '3.2',
                    subtitle: 'Low — good day',
                    accentColor: AppColors.riskLow,
                    icon: Icons.local_fire_department_outlined,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ── Hormonal Phase Card (Female Only) ─────────────────
            _HormonalPhaseCard(),

            const SizedBox(height: 20),

            // ── 3-Day Forecast Preview ────────────────────────────
            SectionHeader(
              title: 'Flare Forecast',
              action: 'Full Report →',
              onAction: widget.onForecastTap,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: ForecastDayCard(day: 'TODAY', date: 'Mar 8', riskPercent: 28, riskLabel: 'LOW', isToday: true)),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'TOMORROW', date: 'Mar 9', riskPercent: 62, riskLabel: 'MODERATE')),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'DAY 3', date: 'Mar 10', riskPercent: 81, riskLabel: 'HIGH')),
              ],
            ),

            const SizedBox(height: 20),

            // ── AI Insight ────────────────────────────────────────
            _AiInsightCard(
              insight: 'Your dairy intake 3 days ago combined with entering your luteal phase is raising your Day 3 flare risk to 81%. Consider reducing dairy for the next 48 hours.',
              triggerItems: ['Dairy (72hr lag)', 'Luteal Phase', 'Low sleep'],
            ),

            const SizedBox(height: 20),

            // ── Today's Food Log Preview ──────────────────────────
            SectionHeader(
              title: "Today's Food",
              action: 'Log Meal +',
              onAction: widget.onFoodTap,
            ),
            const SizedBox(height: 12),
            FoodLogItem(name: 'Oats with Banana', time: '8:12 AM', score: 1, scoreColor: AppColors.riskLow, details: 'Low glycemic · High fiber · Anti-inflammatory'),
            FoodLogItem(name: 'Masala Chai with Milk', time: '10:45 AM', score: 4, scoreColor: AppColors.riskHigh, details: 'Dairy detected · Allergen match ×1.4'),

            const SizedBox(height: 20),

            // ── Skin History Chart ────────────────────────────────
            SectionHeader(title: 'Skin History', action: '30 days →'),
            const SizedBox(height: 12),
            _SkinHistoryChart(),

            const SizedBox(height: 20),

            // ── Morning Check-in Banner ───────────────────────────
            _MorningCheckInBanner(),
          ],
        ),
      ),
      bottomNavigationBar: SkiNovaBottomNav(
        currentIndex: _navIndex,
        onTap: (i) {
          setState(() => _navIndex = i);
          if (i == 2) widget.onForecastTap();
          if (i == 1) widget.onFoodTap();
        },
        showCycle: true,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MALE DASHBOARD
// ─────────────────────────────────────────────────────────────────
class MaleDashboardScreen extends StatefulWidget {
  final VoidCallback onForecastTap;
  final VoidCallback onFoodTap;
  const MaleDashboardScreen({super.key, required this.onForecastTap, required this.onFoodTap});

  @override
  State<MaleDashboardScreen> createState() => _MaleDashboardScreenState();
}

class _MaleDashboardScreenState extends State<MaleDashboardScreen> {
  int _navIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: SkiNovaAppBar(greeting: 'Good morning,', name: 'Arjun'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Today's Skin Snapshot ─────────────────────────────
            _SkinSnapshotCard(isFemale: false, onForecastTap: widget.onForecastTap),

            const SizedBox(height: 20),

            // ── Key Stats ─────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: StatCard(
                    label: 'Skin Score',
                    value: '61',
                    subtitle: '↓ 3 from yesterday',
                    accentColor: AppColors.riskMid,
                    icon: Icons.face_retouching_natural,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    label: 'Inflammatory\nRisk Score',
                    value: '6.1',
                    subtitle: 'Elevated',
                    accentColor: AppColors.riskHigh,
                    icon: Icons.local_fire_department_outlined,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ── Lifestyle Triggers (replaces cycle card for males) ─
            _LifestyleTriggersCard(),

            const SizedBox(height: 20),

            // ── 3-Day Forecast ────────────────────────────────────
            SectionHeader(
              title: 'Flare Forecast',
              action: 'Full Report →',
              onAction: widget.onForecastTap,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: ForecastDayCard(day: 'TODAY', date: 'Mar 8', riskPercent: 55, riskLabel: 'MODERATE', isToday: true)),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'TOMORROW', date: 'Mar 9', riskPercent: 72, riskLabel: 'HIGH')),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'DAY 3', date: 'Mar 10', riskPercent: 44, riskLabel: 'MODERATE')),
              ],
            ),

            const SizedBox(height: 20),

            // ── AI Insight ────────────────────────────────────────
            _AiInsightCard(
              insight: 'Your skin score dropped after 2 nights of poor sleep and the high-dairy + fried food intake 2 days ago. Your forecast shows elevated risk for tomorrow — prioritise sleep and avoid processed foods today.',
              triggerItems: ['Low sleep (2 nights)', 'Dairy + fried food', 'High stress (HRV)'],
            ),

            const SizedBox(height: 20),

            // ── Today's Food Log ──────────────────────────────────
            SectionHeader(
              title: "Today's Food",
              action: 'Log Meal +',
              onAction: widget.onFoodTap,
            ),
            const SizedBox(height: 12),
            FoodLogItem(name: 'Chicken Biryani', time: '1:20 PM', score: 5, scoreColor: AppColors.riskHigh, details: 'High saturated fat · White rice (high GI)'),
            FoodLogItem(name: 'Almonds & Walnuts', time: '4:00 PM', score: 1, scoreColor: AppColors.riskLow, details: 'Omega-3 rich · Zinc source · Anti-inflammatory'),

            const SizedBox(height: 20),

            // ── Skin History ──────────────────────────────────────
            SectionHeader(title: 'Skin History', action: '30 days →'),
            const SizedBox(height: 12),
            _SkinHistoryChart(),

            const SizedBox(height: 20),

            // ── Morning Check-in ──────────────────────────────────
            _MorningCheckInBanner(),
          ],
        ),
      ),
      bottomNavigationBar: SkiNovaBottomNav(
        currentIndex: _navIndex,
        onTap: (i) {
          setState(() => _navIndex = i);
          if (i == 2) widget.onForecastTap();
          if (i == 1) widget.onFoodTap();
        },
        showCycle: false,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared Dashboard Sub-Widgets
// ─────────────────────────────────────────────────────────────────

class _SkinSnapshotCard extends StatelessWidget {
  final bool isFemale;
  final VoidCallback onForecastTap;
  const _SkinSnapshotCard({required this.isFemale, required this.onForecastTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.terracotta,
            AppColors.clay,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.terracotta.withOpacity(0.35),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RiskBadge(
                  label: isFemale ? '• DAY 18 — LUTEAL PHASE' : '• TODAY — MAR 8',
                  color: AppColors.warmWhite,
                ),
                const SizedBox(height: 12),
                Text(
                  isFemale ? 'Skin looking\ngood today' : 'Skin needs\nattention',
                  style: AppTextStyles.headingLarge.copyWith(
                    color: AppColors.warmWhite,
                    fontSize: 26,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  isFemale
                      ? 'Clarity improved. Watch dairy intake — luteal sensitivity elevated.'
                      : 'Inflammatory score is elevated. 2 triggers identified.',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.warmWhite.withOpacity(0.8),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: onForecastTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: AppColors.warmWhite.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.warmWhite.withOpacity(0.4), width: 1),
                    ),
                    child: Text(
                      'View 3-Day Forecast →',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.warmWhite,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Skin score ring
          ProgressRing(
            value: isFemale ? 0.74 : 0.61,
            size: 90,
            color: AppColors.warmWhite,
            centerText: isFemale ? '74' : '61',
            centerLabel: 'SCORE',
            strokeWidth: 7,
          ),
        ],
      ),
    );
  }
}

// Female-only hormonal phase card
class _HormonalPhaseCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final phases = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];
    const currentPhase = 3; // Luteal

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.lavender.withOpacity(0.25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.lavenderDeep.withOpacity(0.3), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.water_drop_rounded, color: AppColors.lavenderDeep, size: 18),
              const SizedBox(width: 8),
              Text('Hormonal Cycle Tracker',
                  style: AppTextStyles.labelBold.copyWith(color: AppColors.lavenderDeep)),
              const Spacer(),
              Text('Day 18', style: AppTextStyles.caption.copyWith(color: AppColors.lavenderDeep)),
            ],
          ),
          const SizedBox(height: 14),

          // Phase timeline
          Row(
            children: List.generate(phases.length, (i) {
              final active = i == currentPhase;
              final past = i < currentPhase;
              return Expanded(
                child: Column(
                  children: [
                    Container(
                      height: 6,
                      margin: EdgeInsets.only(right: i < phases.length - 1 ? 3 : 0),
                      decoration: BoxDecoration(
                        color: past || active ? AppColors.lavenderDeep : AppColors.lavender.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      phases[i],
                      style: AppTextStyles.caption.copyWith(
                        color: active ? AppColors.lavenderDeep : AppColors.mutedBrown,
                        fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                        fontSize: 9,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }),
          ),

          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.lavenderDeep.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, color: AppColors.lavenderDeep, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Luteal phase: Progesterone is elevated — skin is more reactive to dairy and sugar right now.',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.lavenderDeep,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Male-only lifestyle triggers card
class _LifestyleTriggersCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final triggers = [
      _TriggerItem(label: 'Sleep', value: '5.5 hrs', icon: Icons.bedtime_outlined, color: AppColors.riskHigh, note: 'Below optimal'),
      _TriggerItem(label: 'Hydration', value: '1.4 L', icon: Icons.water_drop_outlined, color: AppColors.riskMid, note: 'Slightly low'),
      _TriggerItem(label: 'Stress', value: 'Moderate', icon: Icons.psychology_outlined, color: AppColors.riskMid, note: 'HRV proxy'),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: AppColors.brown.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.monitor_heart_outlined, color: AppColors.terracotta, size: 18),
              const SizedBox(width: 8),
              Text('Lifestyle Triggers', style: AppTextStyles.labelBold),
              const Spacer(),
              Text('Log today →', style: AppTextStyles.bodySmall.copyWith(color: AppColors.terracotta, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: triggers.map((t) => Expanded(
              child: Container(
                margin: EdgeInsets.only(right: t != triggers.last ? 8 : 0),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: t.color.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Icon(t.icon, color: t.color, size: 20),
                    const SizedBox(height: 6),
                    Text(t.value,
                        style: AppTextStyles.labelBold.copyWith(color: t.color, fontSize: 12),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 2),
                    Text(t.label,
                        style: AppTextStyles.caption.copyWith(fontSize: 9),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 3),
                    Text(t.note,
                        style: AppTextStyles.caption.copyWith(color: t.color, fontSize: 9),
                        textAlign: TextAlign.center),
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

class _TriggerItem {
  final String label, value, note;
  final IconData icon;
  final Color color;
  _TriggerItem({required this.label, required this.value, required this.icon, required this.color, required this.note});
}

class _AiInsightCard extends StatelessWidget {
  final String insight;
  final List<String> triggerItems;
  const _AiInsightCard({required this.insight, required this.triggerItems});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.golden.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.golden.withOpacity(0.3), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.golden.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.auto_awesome, color: AppColors.golden, size: 16),
              ),
              const SizedBox(width: 8),
              Text('Skinova AI Insight',
                  style: AppTextStyles.labelBold.copyWith(color: AppColors.golden)),
              const Spacer(),
              Text('Powered by Llama 4',
                  style: AppTextStyles.caption.copyWith(color: AppColors.golden, fontSize: 10)),
            ],
          ),
          const SizedBox(height: 12),
          Text(insight, style: AppTextStyles.bodyMedium.copyWith(height: 1.6)),
          const SizedBox(height: 12),
          Text('TOP TRIGGERS', style: AppTextStyles.caption.copyWith(letterSpacing: 0.8)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: triggerItems.map((t) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.golden.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.golden.withOpacity(0.4), width: 1),
              ),
              child: Text(t,
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.golden,
                    fontWeight: FontWeight.w600,
                  )),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _SkinHistoryChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final data = [58, 62, 60, 65, 70, 68, 72, 69, 74, 71, 74];
    final maxVal = 100;

    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: AppColors.brown.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 3)),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: data.asMap().entries.map((e) {
          final isLast = e.key == data.length - 1;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: e.key < data.length - 1 ? 4 : 0),
              height: (e.value / maxVal) * 68,
              decoration: BoxDecoration(
                color: isLast ? AppColors.terracotta : AppColors.terracotta.withOpacity(0.25),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _MorningCheckInBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.moss.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.moss.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.moss.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.camera_alt_outlined, color: AppColors.moss, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Tomorrow's check-in", style: AppTextStyles.labelBold.copyWith(color: AppColors.moss)),
                const SizedBox(height: 2),
                Text("Take your morning selfie after washing your face.",
                    style: AppTextStyles.bodySmall.copyWith(height: 1.4)),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios_rounded, color: AppColors.moss, size: 14),
        ],
      ),
    );
  }
}
