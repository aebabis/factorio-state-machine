/**
 * Iterates the prime numbers
 */
export default () => 'timer W\n' +
'10:\n' +
'  X = 1\n' +
'  => 20\n' +
'20:\n' +
'  X = X + 1 // Try next number. Starts at 2\n' +
'  D = 1 // Reset divisor\n' +
'  => 30\n' +
'30:\n' +
'  D = D + 1 // Increment divisor\n' +
'  D * D > X => 40 // Number is prime\n' +
'  X % D => 30 // Number might still be prime\n' +
'  => 20 // Number is composite\n' +
'40:\n' +
'  W > 120 => 50 // Wait at least 2 seconds in between outputting primes\n' +
'50:\n' +
'  reset W\n' +
'  P = X // Output prime number to signal_P. 7-segment displays can show it\n' +
'  => 20';
