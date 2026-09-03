# Restricted research-measure test coverage

The browser checks verify the student flow without embedding real scale wording in the public test suite:

- measure items are hidden before classroom authorization;
- K-CAAS-SF uses 12 response slots, range 1–5, and a locked version;
- the Cho (2019) Korean strengths/deficit scale uses 9 response slots with original numbering 1–5 and 7–10, range 0–6, and 5+4 scoring;
- the Inje flow follows anonymous-code creation before research-measure saving;
- authorization remains available across reloads within the same browser tab session;
- learner research-data submission remains blocked independently of read-only measure retrieval.

Tests use synthetic item labels and a mocked measure service so protected wording and the real classroom access code are not committed to GitHub.
