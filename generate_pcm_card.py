import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Data from Form B (estimated bar lengths from the house chart)
# Order: bottom to top in Form A style (Thinker at bottom = longest)
# Form A order: Imaginer at top, Thinker at bottom (reversed for barh = bottom is index 0)
categories = ['Thinker', 'Persister', 'Promoter', 'Rebel', 'Harmonizer', 'Imaginer']
values =     [100,        40,           45,         30,       10,           15]
colors =     ['#4A9BB5',  '#7B1040',   '#CC1111',  '#F5C518', '#E8A020',  '#8B4513']

fig, ax = plt.subplots(figsize=(9, 6))
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# Draw outer double border (teal/blue)
for lw, inset in [(6, 0.01), (2, 0.03)]:
    rect = patches.FancyBboxPatch((inset, inset), 1 - 2*inset, 1 - 2*inset,
                                   boxstyle="round,pad=0", linewidth=lw,
                                   edgecolor='#5BB8C8', facecolor='none',
                                   transform=fig.transFigure, clip_on=False)
    fig.add_artist(rect)

# Title
fig.text(0.5, 0.91, 'SHINYA SANO', ha='center', va='center',
         fontsize=26, fontweight='bold', fontfamily='serif', color='#111111')

# Bar chart area
ax.set_position([0.22, 0.18, 0.72, 0.65])

y_positions = range(len(categories))
bar_height = 0.55

for i, (cat, val, color) in enumerate(zip(categories, values, colors)):
    ax.barh(i, val, height=bar_height, color=color, align='center')

# X axis
ax.set_xlim(0, 100)
ax.set_xticks(range(0, 101, 10))
ax.set_xticklabels([str(x) for x in range(0, 101, 10)], fontsize=9)
ax.set_ylim(-0.6, len(categories) - 0.4)

# Y axis labels
ax.set_yticks(list(y_positions))
ax.set_yticklabels(categories, fontsize=13, ha='right')
ax.yaxis.set_tick_params(pad=8)

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.tick_params(axis='y', length=0)

# Bottom annotations
fig.text(0.22, 0.09, 'Base = Thinker', ha='left', va='center', fontsize=13, color='#111111')
fig.text(0.65, 0.09, 'Phase = Thinker', ha='left', va='center', fontsize=13, color='#111111')

# Copyright
fig.text(0.5, 0.04, '©2011 Kahler Communications, Inc.', ha='center', va='center',
         fontsize=8, color='#555555')

plt.savefig('/home/user/todo-app/pcm_card_forma.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("Saved: pcm_card_forma.png")
