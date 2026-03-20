import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/shared_widgets.dart';

class ForecastScreen extends StatelessWidget {
  final VoidCallback onBack;
  final bool isFemale;

  const ForecastScreen({super.key, required this.onBack, this.isFemale = true});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        leading: GestureDetector(
          onTap: onBack,
          child: Container(
            margin: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.brown, size: 16),
          ),
        ),
        title: Text('3-Day Forecast', style: AppTextStyles.headingMedium),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.terracotta.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.auto_awesome, color: AppColors.terracotta, size: 12),
                const SizedBox(width: 4),
                Text('TFT + Llama 4',
                    style: AppTextStyles.caption.copyWith(color: AppColors.terracotta, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Overall risk header ──────────────────────────────
            _ForecastHeaderCard(isFemale: isFemale),

            const SizedBox(height: 20),

            // ── 3-Day Cards ──────────────────────────────────────
            Text('Daily Breakdown', style: AppTextStyles.headingMedium),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: ForecastDayCard(day: 'TODAY', date: 'Mar 8', riskPercent: isFemale ? 28 : 55, riskLabel: isFemale ? 'LOW' : 'MODERATE', isToday: true)),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'TOMORROW', date: 'Mar 9', riskPercent: isFemale ? 62 : 72, riskLabel: isFemale ? 'MODERATE' : 'HIGH')),
                const SizedBox(width: 10),
                Expanded(child: ForecastDayCard(day: 'DAY 3', date: 'Mar 10', riskPercent: isFemale ? 81 : 44, riskLabel: isFemale ? 'HIGH' : 'MODERATE')),
              ],
            ),

            const SizedBox(height: 20),

            // ── Llama 4 AI Report ────────────────────────────────
            _LlamaExplanationCard(isFemale: isFemale),

            const SizedBox(height: 20),

            // ── TFT Attention Weights ────────────────────────────
            _AttentionWeightsCard(isFemale: isFemale),

            const SizedBox(height: 20),

            // ── Trigger Timeline ─────────────────────────────────
            _TriggerTimeline(isFemale: isFemale),

            const SizedBox(height: 20),

            // ── Recommendations ──────────────────────────────────
            _RecommendationsCard(isFemale: isFemale),

            const SizedBox(height: 20),

            // ── Disclaimer ───────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.sand.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: AppColors.mutedBrown, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This is not a medical diagnosis. Skinova is a wellness tool. Consult a dermatologist for clinical skin assessment.',
                      style: AppTextStyles.caption.copyWith(height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Forecast header card ─────────────────────────────────────────
class _ForecastHeaderCard extends StatelessWidget {
  final bool isFemale;
  const _ForecastHeaderCard({required this.isFemale});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isFemale
              ? [AppColors.clay, const Color(0xFF7A3E28)]
              : [AppColors.dusk, const Color(0xFF5A4535)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.clay.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Next 3 Days',
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.warmWhite.withOpacity(0.7),
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isFemale ? 'High flare risk\nahead on Day 3' : 'Elevated risk\nfor tomorrow',
                  style: AppTextStyles.headingLarge.copyWith(
                    color: AppColors.warmWhite,
                    fontSize: 24,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 10),
                if (isFemale)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.lavenderDeep.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '⟡ Luteal phase amplifies risk',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.lavenderLight,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          ProgressRing(
            value: isFemale ? 0.81 : 0.72,
            size: 96,
            color: AppColors.warmWhite,
            centerText: isFemale ? '81%' : '72%',
            centerLabel: 'PEAK RISK',
            strokeWidth: 7,
          ),
        ],
      ),
    );
  }
}

// ── Llama 4 explanation card ─────────────────────────────────────
class _LlamaExplanationCard extends StatelessWidget {
  final bool isFemale;
  const _LlamaExplanationCard({required this.isFemale});

  @override
  Widget build(BuildContext context) {
    final femaleReport = '''Your skin is likely to experience a moderate-to-high flare by Day 3 (March 10th).

The biggest contributing factor was the dairy-heavy meals you had over the past 3 days — your personal history shows your skin typically responds to dairy within 68–72 hours, and you're currently in your luteal phase, when skin sensitivity to dairy and sugar is clinically elevated.

The poor sleep night 2 days ago added to the inflammatory load. Your body's cortisol response during sleep deprivation amplifies sebum production.

Consider: reducing dairy for the next 48 hours, prioritising 7–8 hours of sleep tonight, and increasing water intake above 2L.''';

    final maleReport = '''Your skin risk is elevated for tomorrow (March 9th) based on the past 72 hours of data.

The primary driver is 2 consecutive nights of sleep below 6 hours — your pattern shows that poor sleep reliably raises your inflammatory skin score within 36–48 hours. This is consistent across your last 3 similar periods.

The high-fat, high-dairy meal logged 2 days ago is a secondary contributor. Normally dairy is moderate-risk for you, but combined with sleep deficit, the cumulative effect is higher.

Consider: prioritising sleep tonight above all else. Your data shows sleep is your #1 personal trigger — even more than food.''';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.brown.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.golden, AppColors.terracotta]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Skinova AI Report', style: AppTextStyles.labelBold),
                  Text('Llama 4 via Groq — grounded in TFT attribution data',
                      style: AppTextStyles.caption),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: AppColors.sand, height: 1),
          const SizedBox(height: 16),
          Text(
            isFemale ? femaleReport : maleReport,
            style: AppTextStyles.bodyMedium.copyWith(height: 1.7),
          ),
        ],
      ),
    );
  }
}

// ── TFT Attention Weights ────────────────────────────────────────
class _AttentionWeightsCard extends StatelessWidget {
  final bool isFemale;
  const _AttentionWeightsCard({required this.isFemale});

  @override
  Widget build(BuildContext context) {
    final femaleFactors = [
      _WeightFactor('Dairy intake (Day -3)', 0.71, AppColors.riskHigh),
      _WeightFactor('Luteal phase state', 0.10, AppColors.lavenderDeep),
      _WeightFactor('Poor sleep (Day -2)', 0.19, AppColors.riskMid),
    ];

    final maleFactors = [
      _WeightFactor('Poor sleep ×2 nights', 0.64, AppColors.riskHigh),
      _WeightFactor('Dairy + fried food (Day -2)', 0.28, AppColors.riskMid),
      _WeightFactor('High IRS (Day -1)', 0.08, AppColors.riskLow),
    ];

    final factors = isFemale ? femaleFactors : maleFactors;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardBg2,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.sand, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bar_chart_rounded, color: AppColors.terracotta, size: 18),
              const SizedBox(width: 8),
              Text('TFT Attention Weights', style: AppTextStyles.labelBold),
              const Spacer(),
              Tooltip(
                message: 'These weights show which factors the AI model found most influential for this forecast.',
                child: Icon(Icons.help_outline_rounded, color: AppColors.mutedBrown, size: 16),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Which factors drove this forecast — extracted directly from the model\'s attention mechanism.',
            style: AppTextStyles.bodySmall,
          ),
          const SizedBox(height: 16),
          ...factors.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(f.label, style: AppTextStyles.labelBold.copyWith(fontSize: 13)),
                    Text(
                      '${(f.weight * 100).toInt()}%',
                      style: AppTextStyles.labelBold.copyWith(color: f.color),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: f.weight,
                    backgroundColor: f.color.withOpacity(0.1),
                    valueColor: AlwaysStoppedAnimation(f.color),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _WeightFactor {
  final String label;
  final double weight;
  final Color color;
  _WeightFactor(this.label, this.weight, this.color);
}

// ── Trigger timeline ─────────────────────────────────────────────
class _TriggerTimeline extends StatelessWidget {
  final bool isFemale;
  const _TriggerTimeline({required this.isFemale});

  @override
  Widget build(BuildContext context) {
    final events = isFemale
        ? [
            _TimelineEvent('Mar 5 (Day -3)', 'High-dairy dinner logged', Icons.restaurant_outlined, AppColors.riskHigh),
            _TimelineEvent('Mar 6 (Day -2)', 'Poor sleep — 4.5 hrs', Icons.bedtime_outlined, AppColors.riskMid),
            _TimelineEvent('Mar 7 (Day -1)', 'Entered luteal phase', Icons.water_drop_outlined, AppColors.lavenderDeep),
            _TimelineEvent('Mar 8 (Today)', 'Skin score: 74 — still clear', Icons.face_retouching_natural, AppColors.riskLow),
            _TimelineEvent('Mar 10 (Day +2)', 'Predicted flare: 81% risk', Icons.warning_amber_rounded, AppColors.riskHigh),
          ]
        : [
            _TimelineEvent('Mar 6 (Day -2)', 'Biryani + fried snacks logged', Icons.restaurant_outlined, AppColors.riskHigh),
            _TimelineEvent('Mar 6 (Day -2)', 'Sleep: 5.2 hrs', Icons.bedtime_outlined, AppColors.riskMid),
            _TimelineEvent('Mar 7 (Day -1)', 'Sleep: 5.8 hrs (2nd poor night)', Icons.bedtime_outlined, AppColors.riskHigh),
            _TimelineEvent('Mar 8 (Today)', 'Skin score: 61 — dropping', Icons.face_retouching_natural, AppColors.riskMid),
            _TimelineEvent('Mar 9 (Day +1)', 'Predicted flare: 72% risk', Icons.warning_amber_rounded, AppColors.riskHigh),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Trigger Timeline', style: AppTextStyles.headingMedium),
        const SizedBox(height: 4),
        Text('How your past inputs led to this forecast.', style: AppTextStyles.bodySmall),
        const SizedBox(height: 14),
        ...events.asMap().entries.map((entry) {
          final i = entry.key;
          final e = entry.value;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Timeline line + dot
              Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: e.color.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(e.icon, color: e.color, size: 15),
                  ),
                  if (i < events.length - 1)
                    Container(width: 1.5, height: 30, color: AppColors.sand),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 6, bottom: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.date, style: AppTextStyles.caption),
                      const SizedBox(height: 2),
                      Text(e.event, style: AppTextStyles.labelBold.copyWith(fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ],
          );
        }),
      ],
    );
  }
}

class _TimelineEvent {
  final String date, event;
  final IconData icon;
  final Color color;
  _TimelineEvent(this.date, this.event, this.icon, this.color);
}

// ── Recommendations card ─────────────────────────────────────────
class _RecommendationsCard extends StatelessWidget {
  final bool isFemale;
  const _RecommendationsCard({required this.isFemale});

  @override
  Widget build(BuildContext context) {
    final femaleRecs = [
      _Rec(icon: Icons.no_meals_outlined, color: AppColors.riskHigh, text: 'Avoid dairy for the next 48 hours — your history shows a 68–72 hr lag'),
      _Rec(icon: Icons.bedtime_outlined, color: AppColors.riskMid, text: 'Prioritise 7–8 hours of sleep tonight to reduce cortisol-driven sebum'),
      _Rec(icon: Icons.water_drop_outlined, color: AppColors.lavenderDeep, text: 'Luteal phase tip: increase water intake and reduce sugar'),
      _Rec(icon: Icons.spa_outlined, color: AppColors.moss, text: 'Consider a lighter moisturiser — skin pore sensitivity is elevated this week'),
    ];

    final maleRecs = [
      _Rec(icon: Icons.bedtime_outlined, color: AppColors.riskHigh, text: 'Sleep is your #1 trigger — aim for 7–8 hrs tonight, this overrides everything'),
      _Rec(icon: Icons.no_meals_outlined, color: AppColors.riskMid, text: 'Avoid dairy and fried food for the next 24 hours'),
      _Rec(icon: Icons.water_drop_outlined, color: AppColors.moss, text: 'Increase water intake above 2.5L to flush inflammatory markers'),
      _Rec(icon: Icons.fitness_center_outlined, color: AppColors.moss, text: 'Light exercise (30 min walk) may reduce inflammatory load via cortisol regulation'),
    ];

    final recs = isFemale ? femaleRecs : maleRecs;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.moss.withOpacity(0.07),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.moss.withOpacity(0.25), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.tips_and_updates_outlined, color: AppColors.moss, size: 18),
              const SizedBox(width: 8),
              Text('Recommendations', style: AppTextStyles.labelBold.copyWith(color: AppColors.moss)),
            ],
          ),
          const SizedBox(height: 14),
          ...recs.map((r) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: r.color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(r.icon, color: r.color, size: 15),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(r.text,
                      style: AppTextStyles.bodySmall.copyWith(height: 1.5)),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _Rec {
  final IconData icon;
  final Color color;
  final String text;
  _Rec({required this.icon, required this.color, required this.text});
}
