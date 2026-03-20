import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// ── Stat Card ──────────────────────────────────────────────────────────────
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final Color accentColor;
  final IconData icon;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    required this.accentColor,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.brown.withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: accentColor, size: 18),
            ),
            const SizedBox(height: 12),
            Text(value,
                style: AppTextStyles.headingLarge.copyWith(color: accentColor)),
            const SizedBox(height: 2),
            Text(label, style: AppTextStyles.bodySmall),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: AppTextStyles.caption),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Risk Badge ─────────────────────────────────────────────────────────────
class RiskBadge extends StatelessWidget {
  final String label;
  final Color color;

  const RiskBadge({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4), width: 1),
      ),
      child: Text(label,
          style: AppTextStyles.caption.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
          )),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────────────────
class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: AppTextStyles.headingMedium),
        if (action != null)
          GestureDetector(
            onTap: onAction,
            child: Text(action!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.terracotta,
                  fontWeight: FontWeight.w500,
                )),
          ),
      ],
    );
  }
}

// ── Progress Ring ──────────────────────────────────────────────────────────
class ProgressRing extends StatelessWidget {
  final double value; // 0.0 to 1.0
  final double size;
  final Color color;
  final String centerText;
  final String? centerLabel;
  final double strokeWidth;

  const ProgressRing({
    super.key,
    required this.value,
    this.size = 100,
    required this.color,
    required this.centerText,
    this.centerLabel,
    this.strokeWidth = 8,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _RingPainter(value: value, color: color, strokeWidth: strokeWidth),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(centerText,
                  style: AppTextStyles.headingLarge.copyWith(
                    fontSize: size * 0.22,
                    color: color,
                  )),
              if (centerLabel != null)
                Text(centerLabel!,
                    style: AppTextStyles.caption.copyWith(fontSize: size * 0.09)),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double value;
  final Color color;
  final double strokeWidth;

  _RingPainter({required this.value, required this.color, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = color.withOpacity(0.12)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    // Progress arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.5708, // start at top
      value * 6.2832, // full circle = 2π
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value;
}

// ── Skinova App Bar ────────────────────────────────────────────────────────
class SkiNovaAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String greeting;
  final String name;
  final VoidCallback? onNotification;
  final VoidCallback? onProfile;

  const SkiNovaAppBar({
    super.key,
    required this.greeting,
    required this.name,
    this.onNotification,
    this.onProfile,
  });

  @override
  Size get preferredSize => const Size.fromHeight(72);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(greeting, style: AppTextStyles.caption.copyWith(letterSpacing: 0.8)),
              Text(name, style: AppTextStyles.headingLarge.copyWith(fontSize: 24)),
            ],
          ),
          Row(
            children: [
              _IconBtn(
                icon: Icons.notifications_outlined,
                onTap: onNotification,
                badge: true,
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onProfile,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.peach,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.terracotta, width: 2),
                  ),
                  child: const Icon(Icons.person_outline, color: AppColors.clay, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool badge;

  const _IconBtn({required this.icon, this.onTap, this.badge = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.sand,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.brown, size: 20),
          ),
          if (badge)
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.terracotta,
                  shape: BoxShape.circle,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Bottom Nav Bar ─────────────────────────────────────────────────────────
class SkiNovaBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final bool showCycle; // female only

  const SkiNovaBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.showCycle = false,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home'),
      _NavItem(icon: Icons.camera_alt_outlined, activeIcon: Icons.camera_alt_rounded, label: 'Scan'),
      _NavItem(icon: Icons.bar_chart_outlined, activeIcon: Icons.bar_chart_rounded, label: 'Forecast'),
      if (showCycle)
        _NavItem(icon: Icons.water_drop_outlined, activeIcon: Icons.water_drop_rounded, label: 'Cycle'),
      _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.warmWhite,
        boxShadow: [
          BoxShadow(
            color: AppColors.brown.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final active = currentIndex == i;
              return GestureDetector(
                onTap: () => onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? AppColors.terracotta.withOpacity(0.12) : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        active ? items[i].activeIcon : items[i].icon,
                        color: active ? AppColors.terracotta : AppColors.mutedBrown,
                        size: 22,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        items[i].label,
                        style: AppTextStyles.caption.copyWith(
                          color: active ? AppColors.terracotta : AppColors.mutedBrown,
                          fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  _NavItem({required this.icon, required this.activeIcon, required this.label});
}

// ── Forecast Day Card ──────────────────────────────────────────────────────
class ForecastDayCard extends StatelessWidget {
  final String day;
  final String date;
  final double riskPercent;
  final String riskLabel;
  final bool isToday;

  const ForecastDayCard({
    super.key,
    required this.day,
    required this.date,
    required this.riskPercent,
    required this.riskLabel,
    this.isToday = false,
  });

  Color get _riskColor {
    if (riskPercent < 30) return AppColors.riskLow;
    if (riskPercent < 60) return AppColors.riskMid;
    if (riskPercent < 80) return AppColors.riskHigh;
    return AppColors.riskCritical;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isToday ? AppColors.terracotta : AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isToday ? AppColors.terracotta : AppColors.brown).withOpacity(0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(day,
              style: AppTextStyles.bodySmall.copyWith(
                color: isToday ? AppColors.warmWhite.withOpacity(0.8) : null,
                fontWeight: FontWeight.w500,
              )),
          const SizedBox(height: 4),
          Text(date,
              style: AppTextStyles.labelBold.copyWith(
                color: isToday ? AppColors.warmWhite : null,
              )),
          const SizedBox(height: 12),
          ProgressRing(
            value: riskPercent / 100,
            size: 70,
            color: isToday ? AppColors.warmWhite : _riskColor,
            centerText: '${riskPercent.toInt()}%',
            centerLabel: 'RISK',
            strokeWidth: 6,
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isToday
                  ? AppColors.warmWhite.withOpacity(0.2)
                  : _riskColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              riskLabel,
              style: AppTextStyles.caption.copyWith(
                color: isToday ? AppColors.warmWhite : _riskColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Food Log Item ──────────────────────────────────────────────────────────
class FoodLogItem extends StatelessWidget {
  final String name;
  final String time;
  final int score;
  final Color scoreColor;
  final String details;

  const FoodLogItem({
    super.key,
    required this.name,
    required this.time,
    required this.score,
    required this.scoreColor,
    required this.details,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
              color: scoreColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.restaurant_outlined, color: scoreColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppTextStyles.labelBold),
                const SizedBox(height: 2),
                Text(details, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(time, style: AppTextStyles.caption),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: scoreColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'IRS $score',
                  style: AppTextStyles.caption.copyWith(
                    color: scoreColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
