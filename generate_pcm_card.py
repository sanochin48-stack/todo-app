import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.font_manager as fm

# ---- Form B data (house chart values) ----
# Top→Bottom in Form A: Imaginer, Harmonizer, Rebel, Promoter, Persister, Thinker
# barh plots bottom→top, so reversed:
categories = ['Thinker', 'Persister', 'Promoter', 'Rebel', 'Harmonizer', 'Imaginer']
values     = [100,        40,           45,         30,      8,            15]
# Form A exact colors per type
colors     = ['#5BA4BE',  '#7A1042',   '#C0181B',  '#F6C317', '#D4831A', '#8B4A1A']

fig = plt.figure(figsize=(8.5, 5.8))
fig.patch.set_facecolor('white')

# ---- Triple-line border (Form A has 3 parallel teal lines) ----
border_color = '#5BB8C8'
for lw, pad in [(1.2, 0.008), (1.2, 0.022), (1.2, 0.036)]:
    rect = patches.Rectangle((pad, pad), 1 - 2*pad, 1 - 2*pad,
                               linewidth=lw * fig.get_dpi() / 72,
                               edgecolor=border_color, facecolor='none',
                               transform=fig.transFigure, clip_on=False)
    fig.add_artist(rect)

# ---- Title ----
fig.text(0.5, 0.905, 'SHINYA SANO', ha='center', va='center',
         fontsize=24, fontweight='bold', family='DejaVu Serif', color='#111111')

# ---- Chart axes ----
ax = fig.add_axes([0.23, 0.20, 0.70, 0.60])
ax.set_facecolor('white')

bar_height = 0.62
for i, (val, color) in enumerate(zip(values, colors)):
    ax.barh(i, val, height=bar_height, color=color, align='center', linewidth=0)

# X axis
ax.set_xlim(0, 100)
ax.set_xticks(range(0, 101, 10))
ax.set_xticklabels([str(x) for x in range(0, 101, 10)],
                   fontsize=9, family='DejaVu Sans', color='#222222')
ax.tick_params(axis='x', length=4, width=0.8, color='#444444')

# Y axis labels (category names)
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
fig.text(0.235, 0.115, 'Base = Thinker', ha='left', va='center',
         fontsize=12, family='DejaVu Serif', color='#111111')
fig.text(0.620, 0.115, 'Phase = Thinker', ha='left', va='center',
         fontsize=12, family='DejaVu Serif', color='#111111')

# ---- Copyright ----
fig.text(0.5, 0.055, '©2011 Kahler Communications, Inc.',
         ha='center', va='center', fontsize=8,
         family='DejaVu Sans', color='#555555')

plt.savefig('/home/user/todo-app/pcm_card_forma.png', dpi=180,
            bbox_inches='tight', pad_inches=0.15,
            facecolor='white', edgecolor='none')
print("Saved.")
