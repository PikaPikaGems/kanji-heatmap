# Scenarios and UX

This document owns the concrete situations a multi-device, offline-first study
engine produces, and the host behavior proposed for each.

It exists because the other documents specify what converges. That is not the
same question as what the user sees while it converges, and the second question
is where a technically correct design becomes a bad product.

Two rules govern everything here:

- **StudyEngine supplies state and typed results. The host owns all copy.**
  Every string below is a proposal for Kanji Heatmap, not part of the contract.
- **Silence is a valid design.** Most of these scenarios should be invisible.
  A notification the user cannot act on is noise, and noise about
  synchronization teaches users to distrust it.

Copy is written in the second person and avoids blaming the user or the
network.

## Scenario index

| #                                                                  | Scenario                        | Visible?              |
| ------------------------------------------------------------------ | ------------------------------- | --------------------- |
| [1](#1-two-tabs-open-the-same-review-card)                         | Two tabs, same review card      | Usually not           |
| [2](#2-two-devices-review-the-same-card)                           | Two devices, same card          | No                    |
| [3](#3-a-sync-lands-while-a-card-is-open)                          | Sync lands mid-card             | No, or one toast      |
| [4](#4-tab-crashes-or-closes-mid-review)                           | Tab closed mid-review           | No                    |
| [5](#5-double-tapping-a-rating-button)                             | Double-tapped rating            | No                    |
| [6](#6-entitlement-expires-near-an-open-card)                      | Entitlement near expiry         | Yes, before the card  |
| [7](#7-the-kanji-was-removed-from-the-pile-elsewhere)              | Removed elsewhere mid-review    | Quiet toast           |
| [8](#8-two-devices-edit-the-same-note)                             | Note edited on two devices      | Yes, gentle           |
| [9](#9-a-stale-editor-saves-over-a-newer-note)                     | Stale editor saves              | Yes, gentle           |
| [10](#10-note-deleted-on-one-device-edited-on-another)             | Delete versus edit              | Quiet toast           |
| [10a](#10a-three-devices-diverge-on-the-same-note-at-once)         | Three-way note divergence       | No extra UI           |
| [11](#11-adding-a-kanji-already-in-the-pile-with-a-different-word) | Word change on a pile item      | Yes, blocking confirm |
| [12](#12-two-devices-add-the-same-kanji-with-different-words)      | Concurrent add, different words | Quiet reconcile       |
| [13](#13-bookmark-added-on-one-device-removed-on-another)          | Bookmark race                   | No                    |
| [14](#14-studying-offline-for-a-long-time)                         | Long offline period             | Ambient only          |
| [15](#15-siblings-sharing-one-computer)                            | Shared computer                 | Yes, at logout        |
| [16](#16-bootstrap-on-a-new-device)                                | First sync on a new device      | Yes, progress         |
| [17](#17-storage-quota-exhausted)                                  | Out of storage                  | Yes, blocking         |
| [18](#18-the-account-was-deleted-elsewhere)                        | Account deleted remotely        | Yes, terminal         |

---

## Reviews

### 1. Two tabs open the same review card

**What happens.** Tab A opens 日 for reading. Tab A broadcasts
`{ reviewing: cardId }`. Tab B's due query skips that card and offers a
different one.

**What the user sees.** Nothing. This is the intended outcome and it is why the
broadcast exists.

**If the broadcast is missed** (a tab was throttled, the channel dropped a
message), both tabs may show 日. If both are graded, two review facts are
recorded from one device and the backend replays them chronologically. The
schedule is correct; the user reviewed the same card twice in a row, which is
mildly odd and harmless.

**Why there is no lock.** A lease row per open card, with renewal, expiry, and
crash takeover, would prevent exactly this cosmetic duplicate — at the cost of
a table, a predicate in every due query, and timer logic that has to survive
background-tab throttling. The duplicate is not a correctness problem, so a
broadcast hint carries the whole feature instead.

**Host guidance.** Do not surface "this card is open elsewhere." The user
opened two tabs of their own study app; explaining the internals of that is not
useful.

### 2. Two devices review the same card

**What happens.** The phone and the laptop both have 日 due. Both are graded,
possibly both offline. Two facts sync. The backend replays them in
chronological order and produces one canonical schedule.

**What the user sees.** Nothing.

**Important correction to a common assumption.** The review handle is _not_ a
cross-device mechanism and could never have been one. It lives in one page's
memory inside one browser profile. Cross-device concurrency is resolved by
replay, not by locking, and it does not need to be prevented.

### 3. A sync lands while a card is open

**What happens.** The user is looking at 日 with "Good → 4 days" under the
button. A pull returns newer canonical state for 日, because the phone graded
it twenty seconds ago.

The handle owns a frozen snapshot, so the incoming row applies immediately to
the projection and the displayed previews do not move. The grade is computed
from the snapshot and carries it as `priorState`; the backend replays both
branches.

**What the user sees.** Nothing, by default.

**Alternatives considered.**

| Option                                                                           | Verdict                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Silent, apply after grade                                                        | **Recommended.** The previews the user read stay true.                |
| Quiet toast after grading: "Also reviewed on another device — schedules merged." | Acceptable if you want the system to feel legible.                    |
| Interrupt mid-card: "Reviewed elsewhere, skip?"                                  | Rejected. Intrusive, and it punishes the user for owning two devices. |

Never let the interval labels change under the user's finger. Pressing "Good"
expecting four days and getting eleven is the failure this whole mechanism
exists to prevent.

### 4. Tab crashes or closes mid-review

**What happens.** The handle was in memory, so it is gone. Nothing was
persisted, no fact was recorded, and the card is still due.

**What the user sees.** Nothing. The card appears again in the next session.

**Host responsibility.** Call `cancel(handleId)` in component teardown — the
React `useEffect` cleanup for the review screen. Without it, the handle lingers
until expiry and the broadcast hint keeps other tabs from offering the card for
that long. It is a cosmetic delay, not a correctness issue, but it is free to
avoid.

### 5. Double-tapping a rating button

**What happens.** The first `grade` consumes the handle. The second returns
`review_handle_consumed`.

**What the user sees.** Nothing. One card advanced, one review recorded.

**Host guidance.** Treat `review_handle_consumed` as a no-op, not an error.
Disable rating buttons on first press as well; the engine guarantee is the
backstop, not a substitute for a responsive button.

### 6. Entitlement expires near an open card

**What happens.** `beginReview` refuses to open any card whose entitlement
lease expires within `openReviewEntitlementMarginMs` (proposed: two minutes),
returning `read_only`.

**What the user sees**, _before_ investing any recall effort:

> **Your subscription has expired**
> Your reviews and notes are still here and still readable. Renew to keep
> reviewing.
> `[Renew]` `[Not now]`

**Why this rather than allowing one last grade.** Letting a card opened while
writable complete one grade after expiry protects at most one card grade, in an
event that occurs roughly once per account lifetime, with a low probability of
landing inside the few seconds a card is open — and it pays for that with a
permanent exception in the write gate, a caveat on a top-level invariant, and a
special field on the handle. Refusing to open the card is strictly better: no
work is lost because none was started, the user is informed earlier, and the
gate stays uniform.

**Note the lease is not the subscription.** The lease is an offline proxy with
its own duration. A paying user who has been offline longer than the lease
window hits this too. The copy should therefore lead with reassurance that the
data is intact, and the host should attempt a session refresh before showing
it.

### 7. The kanji was removed from the pile elsewhere

**What happens.** The user is reviewing 日 on the laptop. The phone removed 日
from the pile and synced. The laptop grades. The fact is accepted, counts
toward daily statistics because the user really did the review, and does not
reactivate the card.

**What the user sees.** A quiet toast after grading:

> 日 was removed from your review pile on another device.

Silence is also defensible here. What is not defensible is failing the grade —
the user did the work, and it belongs in their statistics.

---

## Notes

### 8. Two devices edit the same note

**What happens.** Both edits diverge from the same base revision. The backend
merges them into one canonical note, ordered deterministically:

```markdown
Means "sun" or "day". In 日本 it reads にち.

---

<!-- kh-merge: also edited on another device, 2026-07-26T14:32:00Z -->

Mnemonic: a window with the sun behind it.
```

**What the user sees.** The next time they open that note: both texts, a byte
counter that is over the limit, a disabled save, and one line explaining why.

```text
┌──────────────────────────────────────────────┐
│ Also edited on another device.               │
│ Both edits are below — trim to fit to save.  │
├──────────────────────────────────────────────┤
│ Means "sun" or "day". In 日本 it reads にち. │
│                                              │
│ ---                                          │
│                                              │
│ Mnemonic: a window with the sun behind it.   │
│                                              │
├──────────────────────────────────────────────┤
│                       1,847 / 1,000  [ Save ]│
│                          ^^ red      ^^ off  │
└──────────────────────────────────────────────┘
```

**The over-limit state is the entire resolution UI.** There is no dialog, no
restore button, and no dismiss. The merged note is readable at its merged size,
but `noteMaxUtf8Bytes` applies to every save with no exception, so the user
cannot save anything until they have deleted the half they do not want. The
limit does the work that a "resolve conflict" flow would otherwise have to do.

**Do not say "both versions were kept" and stop there.** Both versions being
present is the problem statement, not the resolution — announcing it as an
outcome tells the user something they cannot act on. The line above names the
cause and the required action in the same breath, and it is the only reason
`hasMergedEdit` exists: without it the host could only show a bare "too long"
error for a length the user did not create.

**Why merge rather than keep a recoverable losing copy.** A conflict copy
satisfies "nothing was lost" only if the user finds it. A copy attached to a
kanji they never open again is never found, and the previous API had no way to
list outstanding conflicts at all — `notes.watch(kanji)` is per-kanji, so a
conflict on an unvisited kanji was invisible forever.

Merging puts both texts where the user is already looking, in the editor they
already use, and removes an entire domain: the `note_conflicts` table, the
`noteConflicts` cache table, `restoreConflict`, `dismissConflict`, the conflict
view types, the conflict UI, and a required R2 write inside the sync
transaction.

**Host guidance.** Render the separator visibly in the editor. Do not
auto-delete either half. Do not block editing behind an acknowledgement.

### 9. A stale editor saves over a newer note

**This is the most common cause of a note merge, and it is not an offline
scenario.**

**What happens.** The user opens the note for 日 on the laptop and walks away
for forty minutes. Meanwhile they edit 日 on the phone and it syncs. They come
back and press save. The laptop's `baseServerRevision` is now stale, so this is
a divergent edit and it merges.

**What the user sees.** Scenario 8's merge and hint.

**Host mitigation, worth doing.** While a note editor is open, subscribe to
`notes.watch(kanji)`. If the canonical content changes underneath an open
editor with unsaved changes, show an inline warning _before_ the user saves:

> This note was just updated on another device. Saving will keep both versions.

That converts a surprise into an informed choice, and costs one subscription
the screen already has.

**Same-device tabs cannot cause this.** Two tabs share one IndexedDB row and
one outbox sequence, so the second edit is always a direct descendant of the
first. Only genuinely separate devices diverge.

### 10. Note deleted on one device, edited on another

**What happens.** The edit wins. The note stays active with the edited content.
Reviving text is recoverable; losing it is not.

**What the user sees.** A quiet toast on the device that deleted it, next time
it syncs and the user visits that kanji:

> This note was edited on another device, so it was kept.

If they still want it gone, they delete it again. That is one extra tap in a
rare case, and it is the correct direction to fail in.

### 10a. Three devices diverge on the same note at once

**What happens.** Two divergent edits can never overflow the stored ceiling,
because each edit is capped at `noteMaxUtf8Bytes` and the ceiling is at least
twice that. Only a third device diverging from the same pre-merge base can push
past it. At `4 × noteMaxUtf8Bytes` this is beyond any realistic number of
devices editing one kanji's note offline simultaneously.

**What the user sees.** Scenario 8, unchanged. The note is over the limit and
must be trimmed to save. If the absolute ceiling was reached, the tail is cut
at a UTF-8 scalar boundary and ends in `⋯`.

**No dedicated UI, deliberately.** No warning code, no banner sentence, no
archived recovery copy, no support path. The user is already in the state
scenario 8 puts them in — an over-limit note they must resolve — so a separate
explanation would add a concept without changing what they do next. This is a
bounds check, like rejecting a malformed timestamp.

---

## Review pile

### 11. Adding a kanji already in the pile with a different word

**What happens.** 日 is in the pile as 日本. The user taps "Add 日曜日 to my
review pile." `add` returns
`{ code: "pile_item_exists", kanji: "日", currentWord: "日本" }`.

**What the user sees**, a blocking confirmation, because this is destructive:

> **Replace 日本 with 日曜日?**
> 日 is already in your review pile as **日本**. Switching words starts this
> kanji over — your current review progress for 日 will be lost.
> `[Switch to 日曜日]` `[Keep 日本]`

On confirm the host calls `replaceWord({ kanji, word })`.

**Why remove-and-add rather than an in-place word change.** The word is what
the cards test. A schedule describes a memory of 日 _in 日本_; it does not
describe a memory of 日曜日. Carrying the schedule across would attach FSRS
state to content it never measured.

**Why the engine exposes `replaceWord` rather than letting the host call
`remove` then `add`.** Two host calls have a failure window between them. If
`add` fails — `storage_quota`, a validation slip, a crash — the user has lost
their schedule _and_ has no pile item, and the removal is already committed so
the host cannot undo it. Two calls also make the kanji briefly absent from
`watchMany`, which flickers list badges. `replaceWord` does both in one local
transaction and emits the same two wire operations.

**If the word is identical**, `add` is idempotent and returns the existing item.
Double-tapping the add button must never create a second generation.

### 12. Two devices add the same kanji with different words

**What happens.** Both devices are offline. The phone adds 日 as 日本, the
laptop adds 日 as 日曜日. Both `review_pile_add` operations arrive. The backend
must not create two active generations, so the first accepted wins and the
second receives a `pile_item_exists` warning.

**What the user sees.** On the losing device, the pile item quietly becomes 日本
on next sync. No prompt.

A prompt here would be worse than the reconcile: the user made both choices
themselves, minutes or hours apart, and asking them to arbitrate a decision
they no longer remember making is not respectful of their attention. If the
word matters to them, scenario 11 is available and explicit.

---

## Bookmarks

### 13. Bookmark added on one device, removed on another

**What happens.** Deterministic last-writer-wins on
`(clampedUpdatedAt, deviceId, deviceSequence)`. The row's `active` flag settles
one way and propagates.

**What the user sees.** Nothing. A bookmark is a boolean; there is nothing to
recover and nothing to arbitrate.

**A live bug this design fixes.** Today bookmarks are keyed
`b:<kanji>:<word>` where the word comes from the representative-word provider,
and `buildPracticeDeck` filters with `isBookmarked(kanji, word)` using whatever
that provider currently returns. A data update that changes a kanji's
representative word silently orphans every existing bookmark for that kanji: it
vanishes from the "bookmarked only" practice filter with no user action and no
way to notice. Keying by kanji alone removes the failure mode.

---

## Access, storage, and lifecycle

### 14. Studying offline for a long time

**What happens.** Mutations commit locally and queue. The lease keeps the
account writable until it expires.

**What the user sees.** Ambient status only — a small "N changes waiting to
sync" indicator, ideally in a settings or account area rather than over the
study surface. No modal, no banner over the review screen, no per-grade
confirmation.

**What the user must never see.** A claim that something saved when it did not,
and a warning implying their work is at risk while the outbox is intact. The
work _is_ durable locally; the honest message is "not yet synced," never "not
saved."

If the lease is close to expiring while offline, warn once at a useful
threshold rather than repeatedly.

### 15. Siblings sharing one computer

**What happens.** Two accounts alternate on one browser profile. Both caches
are retained, so switching does not re-bootstrap.

**What the user sees at logout** — and this is where the default matters:

> **Sign out**
> ☐ Remove my study data from this computer
> Leaving this unchecked keeps your data here so signing back in is instant.
> Anyone using this computer can sign in to their own account; they cannot open
> yours.

**The default should be unchecked when a second cache already exists**, and
checked on what looks like a personal device. Checking it by default destroys
the exact benefit the two-cache policy exists to provide.

**Say this honestly in product copy if asked.** Two caches is a convenience,
not a security boundary. Sibling A cannot reach sibling B's notes through any
UI path — signed-out access clears the active cache pointer and repositories
refuse to open a database without an authorized account context — but
IndexedDB is not encrypted, and anyone with devtools access to that browser
profile can inspect what is stored. Do not imply otherwise.

**If pending data would be discarded**, the second confirmation is required and
must name what is at stake:

> You have 14 changes that have not synced yet. Removing your data from this
> computer will discard them permanently.
> `[Remove anyway]` `[Cancel]`

### 16. Bootstrap on a new device

**What happens.** Paged download into the account database while access is
`bootstrapping`. Reads and writes are both gated until the last page lands.

**What the user sees.** Determinate progress if `totalPages` is known,
indeterminate otherwise:

> Setting up your study data on this device…

**Host guidance.** Do not render an empty dashboard or an empty pile during
bootstrap — an account mid-bootstrap looks identical to an empty account, and
showing "0 bookmarks" to someone with 400 is alarming. Gate the whole study
surface on the bootstrap state.

If the browser is closed mid-bootstrap, it resumes from the persisted cursor.
No user action, no explanation needed.

### 17. Storage quota exhausted

**What happens.** The local transaction cannot commit, so the mutation returns
`storage_quota`. Nothing was written and nothing is claimed to have been.

**What the user sees**, blocking, at the point of the failed action:

> **Could not save — this browser is out of space**
> Your existing study data is safe. Free up space in your browser and try
> again.
> `[Try again]`

**Host guidance.** For a failed grade, keep the review screen open. The handle
remains valid until expiry, so "Try again" can genuinely retry the same grade
rather than making the user recall the card a second time.

Never report success and drop the write. That is the one failure this system
must not have.

### 18. The account was deleted elsewhere

**What happens.** On next contact the backend reports the deleted state. The
engine purges the matching local cache and outbox and never replays queued
operations into a new account.

**What the user sees.** A terminal, non-dismissible state:

> **This account has been deleted**
> Your study data has been removed from this device.

No retry affordance, no offer to restore. The deletion was confirmed elsewhere
and is authoritative.

---

## Copy principles

Applying across every scenario above:

- **Prefer silence.** If the system resolved it correctly and the user has no
  decision to make, say nothing.
- **Never blame the network or the user.** "Not synced yet" rather than "sync
  failed"; "could not save" rather than "you are offline."
- **Never claim durability you do not have.** A local commit is "saved on this
  device," not "saved."
- **Reassure before instructing.** Every message about expiry, deletion, or
  storage should first say what is _not_ lost.
- **Blocking modals only for destructive confirmations** — scenarios 11, 15,
  17, 18. Everything else is a toast, an inline hint, or nothing.
- **The engine never supplies copy.** It supplies a typed `Result` and a
  snapshot; the host decides what, if anything, that means to a person.
