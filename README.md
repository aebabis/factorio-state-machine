# factorio-state-machine

## Overview

The Factorio State Machine language allows you do create Factorio circuit networks that
implement finite state machines. A program has the following anatomy:

- Zero or more timer declarations
- One or more states. Each state has
  - Zero or more statements
  - One or more state transitions

## Variables

Factorio state machines operate by reading and writing to signal values.
Any signal can be used as a variable, however, it is advised that you only write to letter signals.
When reading item or chemical values, use their names, all lowercase and with underscore delimeters.
These are the same names that [Factorio Blueprint](https://github.com/demipixel/factorio-blueprint/blob/56562f32b0b33d722341fabbb032628e06fab3db/defaultentities.js)
uses.

## Timers

Timers, if used, must be declared at the beginning of a program.
If a variable is declared as a timer, the corresponding signal will be automatically incremented by 1 each tick.
The timer can still be read and written to as a normal variable.
Only letters signals can be timers.

```
timer T
```

You will usually want to reset a timer after a condition is met. Do this using the `reset`
keyword

```
reset T
```

This is equivalent to the statement `T = 0` but improves readability

## States

A state is a group of statements and transitions that will be run consecutively when the machine routes to it. A state begins with a state label

```
10:
```

A state label must be an integer followed by a colon. A possible degenerate behavior is for
combinators to operate while a blueprint is being constructed, resulting in unspecified
behavior. To prevent this, it is recommended that you do not use a `0` state.

In the future, the language may allow alphanumeric labels which are dynamically assigned to integers.

## Statements

All statements in Factorio State Machine are assignments. The lvalue must be a signal name,
and the rvalue must be an expression. Expressions can be compound expressions and use
JavaScript syntax and operation precendence. The following operands are supported:

`!`, `||`, `&&`, `^`, `!=`, `==`, `<`, `>`, `<=`, `>=`, `<<`, `>>`, `+`, `-`, `*`, `/`, `%`, and `**`.

Parenthesis are also allowed. By convention, you should indent statements.

## Transitions

Transitions are executed after a state's statements and determine the next state to visit.
A state must have at least one transition.

Transitions consist of an optional expression, followed by an arrow (`=>`), and ending with a
a state name. The machine will evaluate the expression and jump to the named state if that
expression has value.

```
X == 1 => 10  // Goes to state 10 if X equals 1
```

If a transition has no expression before the arrow, it is an unconditional jump. A state may
have no more than one unconditional jump.

```
=> 20  // Always jumps to state 20
```

Transitions are checked sequentially, and the machine will branch on the first transition
whose condition is met. A sequence of transitions not terminated by an explicit unconditional 
jump will be implicitly terminated with an unconditional jump to the current state. Therefore,
if none of the conditions are met, the machine will jump back to the beginning of the current
state.

By convention, you should indent transitions.

## State Spacing

An instruction pointer (usually `signal_S`) represents the current state.
For example, if `signal_S` is 10, that means the state machine is in state 10.
To ensure that statements execute at the appropriate time rather than continuously,
any value they output is guarded by a state check. For example, the following snippet

```
10:
    X = 5
```

is converted to the following intermediate form when compiled:

```
X = (S == 10) * 5
```

This approach works because the instruction pointer is incremented continuously.

If a state has multiple statements, they are executed sequentially and cannot all
be guarded by the same state value.
For example, the first may be guarded by `S == 10`, but the next may be guarded by `S == 12`.
For this reason, it is possible to write code where the states would overlap.
The compiler will tell you if you do this.

You can avoid overlap by not having too many instructions per state.
By convention, you should have your state labels be multiples of 10 and increment them by 10
as needed.

## Use with Machines

Most of the time, you will want your state machine to control machines such as inserters.
To do this, connect them to the logistic network using red wires, then set them to check the 
target condition.
Remember that you can use the instruction pointer (`signal_S`) as part of a condition.
This can prevent the need for flag variables.

## Example

Below is a sample program that finds the prime numbers. It uses all the features in this guide

```
timer W
10:
  X = 1
  => 20
20:
  X = X + 1 // Try next number. Starts at 2
  D = 1 // Reset divisor
  => 30
30:
  D = D + 1 // Increment divisor
  D * D > X => 50 // Number is prime
  X % D > 0 => 30 // Number might still be prime
  => 20 // Number is composite
50:
  W > 120 => 60 // Wait at least 2 seconds in between outputting primes
60:
  reset W
  P = X // Output prime number to signal_P. 7-segment displays can show it
  => 20
```
