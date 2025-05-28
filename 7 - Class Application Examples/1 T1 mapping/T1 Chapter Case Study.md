---
title: T1 Chapter Case Study
subtitle: Starting page
date: 2025-02-12
label: flairIntro
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  headings: false
---

# Fictitious Case Study: Patient with Neurological Symptoms Consistent with MS

## Patient Presentation
A 32-year-old female presents to the neurology clinic with a 3-month history of intermittent numbness and weakness in her left leg, accompanied by episodes of blurred vision in her right eye. She reports that these symptoms last for several days and then partially resolve. She has no significant past medical history but mentions a family history of autoimmune diseases.

## Clinical Suspicion
The patient’s symptoms are consistent with a demyelinating disorder, such as multiple sclerosis (MS). To confirm the diagnosis, the neurologist orders an MRI of the brain and spinal cord.

:::{dropdown} McDonald Criteria (2017) for MS Diagnosis
**Clinical Attacks**: At least two clinical attacks with evidence of two or more lesions OR two clinical attacks with evidence of one lesion (dissemination in space, DIS) and historical evidence of a prior attack.

**MRI Evidence:**

- **Dissemination in space (DIS)**: ≥1 T2 lesion in at least 2 of 4 MS-typical regions (periventricular, cortical/juxtacortical, infratentorial, or spinal cord).

- **Dissemination in time (DIT)**: Simultaneous presence of gadolinium-enhancing and non-enhancing lesions OR new T2 or gadolinium-enhancing lesions on follow-up MRI.

- **CSF Analysis**: Oligoclonal bands in cerebrospinal fluid (CSF) can support the diagnosis if MRI criteria are not fully met.

**Exclusion of Other Diagnoses**: Symptoms must not be better explained by another condition.
:::

`````{exercise}
:label: T1Question1
:class: dropdown

The practicing radiologist provides you with two images and their acquisition protocols. Based on the parameters, you need to determine what types of images these are. Here are the protocols again for reference:

:::{figure} #flair2jn
:label: flairPlot1
:enumerator: 7.1
Spoiled gradient echo, 2 mm^2 in-plane resolution, 5 mm slice, TR = 1 s, TE = 15 ms, FA = 70 degrees
:::

:::{figure} #flair1jn
:label: flairPlot2
:enumerator: 7.2
Spoiled gradient echo, 2 mm^2 in-plane resolution, 5 mm slice, TR = 5 s, TE = 150 ms, FA = 90 degrees
:::

What types of MRI images are ([](#flairPlot1), [](#flairPlot2))?

````{dropdown} **A** - (PD-weighted, T1-weighted)

**INCORRECT ANSWER**

The correct answer was: **C** - (T1-weighted, T2-weighted)

````

````{dropdown} **B** - (PD-weighted, T2-weighted) 

**INCORRECT ANSWER**

The correct answer was: **C** - (T1-weighted, T2-weighted)


````

````{dropdown} **C** - (T1-weighted, T2-weighted)
:class: dropdown

**CORRECT ANSWER**

````

````{dropdown} **D** - (T2-weighted, T1-weighted)
:class: dropdown

**INCORRECT ANSWER**

The correct answer was: **C** - (T1-weighted, T2-weighted)

````

````{solution} T1Question1
:class: dropdown


:::{table}
:label: question1Table
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Proton density weighted</th>
      <th colspan="1" align="center">T1 weighted</th>
      <th colspan="1" align="center">T2 weighted</th>

   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Echo Time (TE)</bold></td>
      <td colspan="1" align="center">Medium</td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Repetition time (TR)</bold></td>
      <td colspan="1" align="center">Medium</td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
   </tr>
</table>
:::

T1-weighted images are optimized for greater T1 contrast between tissues-of-interest, while T2-weighted images are optimized for greater T2 contrast between tissues-of-interest.

Revisiting [](#vfaPlot1) and [](#t2Plot2), can you explain out why the T1w parameters were chosen to be [TR = 1 s, TE = 15 ms] and not [TR = 5s, TE = 150 ms]? Why was T2w protocol parameters [TR = 5s, TE = 150 ms] instead of [TR = 1 s, TE = 15 ms]?

```{embed} #irPlot1
```

```{embed} #t2Plot2
```

A common trick is to remember that white-matter is white in T1-weighted images, and water is bright in T2-weighted images. Here are those images again:

```{embed} #flairPlot2
```

```{embed} #flairPlot1
```


````

`````

# Return to Case Study

The radiologist expresses concern that the standard T2-weighted image does not provide sufficient contrast to clearly identify periventricular lesions, which are a hallmark of MS. Given that these lesions are expected to consist of inflamed axon fibers with higher water content, the radiologist asks for your help in designing an imaging protocol that can better differentiate between the hyperintense CSF in the ventricles and the hyperintense periventricular lesions.

`````{exercise}
:label: T1Question2
:class: dropdown

Look at [](#flairPlot2), can you easily identify these lesions?

From the information provided above, how do you think the T1 and T2 values will differ in a lesions vs normal white matter?

````{dropdown} **A** - (T1 increased, T2 decreases)
:class: dropdown

**INCORRECT ANSWER**

````

````{dropdown} **B** - (T1 decreases, T2 increases)
:class: dropdown

**INCORRECT ANSWER**

````

````{dropdown} **C** - (T1 increase, T2 barely changes)
:class: dropdown

**INCORRECT ANSWER**

````

````{dropdown} **D** - (T1 barely changes, T2 increases)
:class: dropdown

**CORRECT ANSWER**!

````


````{solution} T1Question2
:class: dropdown

The correct answer was: **D** - (T1 barely changes, T2 increases)

````

`````

The periventricular lesions are expected to be due to inflammation that leads to odeoma, which results in an increase in water content (increasing T2) but too early for permanent dammage of the underlying structures (T1 will change, but not dramatically).

Let's assume that the periventricular lesions have T2 is close to the ventricular T2, but that lesion T1 values remain close to their healthy values. Given what the radiologist requested from you,

>the radiologist asks for your help in designing an imaging protocol that can better differentiate between the hyperintense CSF in the ventricles and the hyperintense periventricular lesions.

we want to design a pulse sequence that will provide better contrast between the periventricular lesions and the ventricles. Here's a summary table of some expected parameters:

:::{table}
:label: question2Table
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Healthy WM</th>
      <th colspan="1" align="center">Ventricles</th>
      <th colspan="1" align="center">Periventricular lesion</th>

   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T1</bold></td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
      <td colspan="1" align="center">Short</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T2</bold></td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
      <td colspan="1" align="center">Long</td>
   </tr>
</table>
:::

After some reflection, it should become clear why periventricular lesions are difficult to be observed with simple T1w and T2w images. In T1w images, the lesions have similar signal values to the nearby WM, and in T2w images they have similar signal values to the nearby ventricles. As lesions predominently exhibit an increase in water content, we'll want to design a sequence that has some T2-weighting, but with increase contrast between the lesion and ventricles.

`````{exercise}
:label: T1Question3
:class: dropdown

Examine [](#irPlot1), [](#vfaPlot1), [](#t2Plot2), and [](#question2Table). Reflect and discuss on possible strategies for designing a sequence with improved contrast between the periventricular lesions and the ventricles. 

````{solution} T1Question3
:class: dropdown

If you landed on using an inversion recovery sequence with an inversion time that nulls the ventricular signal, congratulation, you just discovered **FLAIR (FLuid Attenuation Inversion Recovery)**! 

````

`````

FLAIR (FLuid Attenuation Inversion Recovery is a widely used technique, particular in suspected MS cases. It provides good T2 weighting with nearly no signal in purely ventricular regions.

Let's design a FLAIR protocol!

`````{exercise}
:label: T1Question4
:class: dropdown

Using [](#irPlot4) and [](#irPlot1), approximately what inversion time should your sequence have?

````{dropdown} **A** - (TI = 50 ms)
:class: dropdown

**INCORRECT ANSWER**

You selected a very short TI of 50 ms. Here is what an inversion recovery image with this TI would look like:

:::{figure} #flair4ajn
:label: flairPlot4a
:enumerator: 7.3
Inversion recovery image with TI = 50 ms, TR = 5 s, TE = 15 ms, FA = 90 degrees
:::

As you can see, there is little contrast at all accross tissues for a very short TI, as can be deduced via [](#irPlot2). No tissue signal is nulled. Here are the simulated images for the three other answers: [](#flairPlot4b), [](#flairPlot4c), and [](#flairPlot4d).

````

````{dropdown} **B** - (TI = 500 ms)
:class: dropdown

**INCORRECT ANSWER**

You selected a TI of 500 ms. Here is what an inversion recovery image with this TI would look like:

:::{figure} #flair4bjn
:label: flairPlot4b
:enumerator: 7.4
Inversion recovery image with TI = 500 ms, TR = 5 s, TE = 15 ms, FA = 90 degrees
:::

As you can see, white matter is quite dark, meaning this TI nulls the white matter signal. This could have been deduced from [](#irPlot2) by hovering the cursor over the white matter signal where it crosses 0. Here are the simulated images for the three other answers: [](#flairPlot4a), [](#flairPlot4c), and [](#flairPlot4d).

````


````{dropdown} **C** - (TI = 1 s)
:class: dropdown

**INCORRECT ANSWER**

You selected a TI of 1 s. Here is what an inversion recovery image with this TI would look like:

:::{figure} #flair4cjn
:label: flairPlot4c
:enumerator: 7.5
Inversion recovery image with TI = 1 s, TR = 5 s, TE = 15 ms, FA = 90 degrees
:::

As you can see, grey matter is quite dark, meaning this TI nulls the grey matter signal. This could have been deduced from [](#irPlot2) by hovering the cursor over the grey matter signal where it crosses 0. Here are the simulated images for the three other answers: [](#flairPlot4a), [](#flairPlot4b), and [](#flairPlot4d).
````

````{dropdown} **D** - (TI = 3 s)
:class: dropdown


**CORRECT ANSWER**

**You got the correct answer!** Click on the solution below.

````

````{solution} T1Question4
:class: dropdown


The correct solution was **D** - (TI = 3 s). Here is what an inversion recovery image with this TI would look like:

:::{figure} #flair4djn
:label: flairPlot4d
:enumerator: 7.6
Inversion recovery image with TI = 3 s, TR = 5 s, TE = 15 ms, FA = 90 degrees
:::

As you can see, ventricles are quite dark, meaning this TI nulls the ventricular signal. This is clearly deduced from [](#irPlot2) by hovering the cursor over the white matter signal where it crosses 0. Here are the simulated images for the three other answers: [](#flairPlot4a), [](#flairPlot4b), and [](#flairPlot4c).


````

`````

Now, despite knowing the correct inversion time, we still can't see the lesions from [](#flairPlot4d). We need to add T2 weighting to this inversion recovery image. 

`````{exercise}
:label: T1Question5
:class: dropdown

What protocol should we use to get the best contrast? 

````{dropdown} **A** - (TI = 3 s, TR = 10 s, TE = 150 ms, FA = 90 deg)
:class: dropdown

Here is what an inversion recovery image with this protocol would look like:

:::{figure} #flair5ajn
:label: flairPlot5a
:enumerator: 7.7
Inversion recovery image with TI = 3 s, TR = 10 s, TE = 150 ms, FA = 90 deg
:::

Do you think this is the correct answer? Can you see lesions? When you are ready, click on the solution below.

````

````{dropdown} **B** - (TI = 3 s, TR = 5 s, TE = 15 ms, FA = 20 deg)
:class: dropdown

Here is what an inversion recovery image with this protocol would look like:

:::{figure} #flair5bjn
:label: flairPlot5b
:enumerator: 7.8
Inversion recovery image with TI = 3 s, TR = 5 s, TE = 15 ms, FA = 20 degrees
:::

Do you think this is the correct answer? Can you see lesions? When you are ready, click on the solution below.

````

````{dropdown} **C** - (TI = 3 s, TR = 1 s, TE = 150 ms, FA = 45 deg)
:class: dropdown

**INCORRECT ANSWER**

You selected a TR that's shorter than TI, which is not possible. Go back and try again.

````

````{dropdown} **D** - (TI = 3 s, TR = 3.1 s, TE = 1 s, FA = 90 deg)
:class: dropdown

Here is what an inversion recovery image with this protocol would look like:

:::{figure} #flair5djn
:label: flairPlot5d
:enumerator: 7.9
Inversion recovery image with TI = 3 s, TR = 3.1 s, TE = 1 s, FA = 90 deg
:::

Do you think this is the correct answer? Can you see lesions? When you are ready, click on the solution below.

````

````{solution} T1Question5
:class: dropdown

The correct answer was **A - (TI = 3 s, TR = 10 s, TE = 150 ms, FA = 90 deg)**. Here's what this FLAIR image looks like:

```{embed} #flairPlot5a
```

Two periventricular lesions are clearly identifiable using this imaging protocol, which were hard to see on a regular T2w image [](#flairPlot2). The properly timed TI nulled the ventricular signal, whereas that long TR and TE provided sufficient T2 weighting to contrast against the nearby white matter, resulting in bright lesions, which are typically called hyperintese lesions.

````

`````