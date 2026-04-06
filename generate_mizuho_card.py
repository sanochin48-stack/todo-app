import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# ---- Form C data ----
# Form C order top→bottom: Rebel, Imaginer, Promoter, Thinker, Persister, Harmonizer
# barh plots bottom→top, so reversed:
categories = ['Harmonizer', 'Persister', 'Thinker', 'Promoter', 'Imaginer', 'Rebel']
values     = [100,           78,          38,         22,          13,         9]
bar_colors = ['#E8760A',    '#7B3FA0',   '#5BA4BE',  '#C0181B',  '#A0522D',  '#F6C317']

# Base = Harmonizer (orange), Phase = Persister (purple)
outer_border_color = '#E8760A'   # Harmonizer orange
inner_border_color = '#7B3FA0'   # Persister purple

fig = plt.figure(figsize=(8.5, 5.8))
fig.patch.set_facecolor('white')

# ---- Border: outer=thick single line (Base color), inner=thin single line (Phase color) ----
# Outer thick line (Base = Harmonizer orange)
pad = 0.012
rect = patches.Rectangle((pad, pad), 1 - 2*pad, 1 - 2*pad,
                           linewidth=5.0,
                           edgecolor=outer_border_color, facecolor='none',
                           transform=fig.transFigure, clip_on=False)
fig.add_artist(rect)

# Inner thin line (Phase = Persister purple)
pad = 0.038
rect = patches.Rectangle((pad, pad), 1 - 2*pad, 1 - 2*pad,
                           linewidth=1.4,
                           edgecolor=inner_border_color, facecolor='none',
                           transform=fig.transFigure, clip_on=False)
fig.add_artist(rect)

# ---- Title ----
fig.text(0.5, 0.905, 'MIZUHO SANO', ha='center', va='center',
         fontsize=24, fontweight='bold', family='DejaVu Serif', color='#111111')

# ---- Chart axes ----
ax = fig.add_axes([0.23, 0.20, 0.70, 0.60])
ax.set_facecolor('white')

bar_height = 0.62
for i, (val, color) in enumerate(zip(values, bar_colors)):
    ax.barh(i, val, height=bar_height, color=color, align='center', linewidth=0)

# X axis
ax.set_xlim(0, 100)
ax.set_xticks(range(0, 101, 10))
ax.set_xticklabels([str(x) for x in range(0, 101, 10)],
                   fontsize=9, family='DejaVu Sans', color='#222222')
ax.tick_params(axis='x', length=4, width=0.8, color='#444444')

# Y axis labels
ax.set_ylim(-0.65, len(categories) - 0.35)
ax.set_yticks(range(len(categories)))
ax.set_yticklabels(categories, fontsize=13, family='DejaVu Serif',
                   ha='right', color='#111111')
ax.tick_params(axis='y', length=0, pad=10)

# Spines
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_linewidth(0.8)
ax.spines['bottom'].set_color('#444444')

# ---- Bottom labels ----
fig.text(0.235, 0.115, 'Base = Harmonizer', ha='left', va='center',
         fontsize=12, family='DejaVu Serif', color='#111111')
fig.text(0.600, 0.115, 'Phase = Persister', ha='left', va='center',
         fontsize=12, family='DejaVu Serif', color='#111111')

# ---- Copyright ----
fig.text(0.5, 0.055, '©2011 Kahler Communications, Inc.',
         ha='center', va='center', fontsize=8,
         family='DejaVu Sans', color='#555555')

plt.savefig('/home/user/todo-app/mizuho_sano_forma.png', dpi=180,
            bbox_inches='tight', pad_inches=0.15,
            facecolor='white', edgecolor='none')
print("Saved.")
