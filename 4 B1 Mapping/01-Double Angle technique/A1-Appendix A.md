---
title: Appendix A
subtitle: Double Angle technique
date: 2024-07-25
name: daAppendixA
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

```{math}
:label: daEqA1
:enumerator:
\begin{equation}
\begin{split}
\text{e}^{i2\alpha} &= \text{e}^{i\left( \alpha+\alpha \right)} \\
&= \text{e}^{i\alpha+i\alpha} \\
&= \text{e}^{i\alpha}\text{e}^{i\alpha} \\
&= \left( \text{cos}\left( \alpha \right)+i\text{sin}\left( \alpha \right) \right)\left( \text{cos}\left( \alpha \right)+i\text{sin}\left( \alpha \right) \right) \\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)+i^{2}\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)+\left( -1 \right)\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)-\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}^{2}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\\
&= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( \text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right) +\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right) \right)\\
&= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( \text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right)+\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right) \right)\\
\text{e}^{i2\alpha} &= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right)\\
\text{cos}\left( 2\alpha \right)+i\text{sin}\left( 2\alpha \right) &= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right)\\
\end{split} \\ \\
\text{For }z \in \mathbb{C} \text{ and }q \in \mathbb{C}\text{,}\\
\text{if }z=q \\ 
\text{then }\text{Re}\left( z \right)=\text{Re}\left( q \right) \\
\text{ and }\text{Im}\left( z \right)=\text{Im}\left( q \right) \\
\text{thus,} \\ \\
\begin{split}
\text{Im}\left( \text{cos}\left( 2\alpha \right)+i\text{sin}\left( 2\alpha \right) \right) &= \text{Im}\left( \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right) \right)\\
\text{sin}\left( 2\alpha \right) &= 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \\
\end{split}\\
Q.E.D.
\end{equation}
```

