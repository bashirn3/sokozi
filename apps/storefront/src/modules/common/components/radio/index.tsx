const Radio = ({
  checked,
  "data-testid": dataTestId,
}: {
  checked: boolean
  "data-testid"?: string
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className="group relative flex h-5 w-5 items-center justify-center rounded-full outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      data-testid={dataTestId || "radio-button"}
    >
      {/* Circular because the control's meaning depends on it, so this is one
          of the documented exceptions to the single radius rule. The ring is a
          real border now rather than a box-shadow. */}
      <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-ink bg-paper transition-colors group-data-[state=checked]:bg-ink group-disabled:border-hairline group-disabled:bg-paper-shade">
        {checked && (
          <div className="h-1.5 w-1.5 rounded-full bg-paper group-disabled:bg-ink-muted" />
        )}
      </div>
    </button>
  )
}

export default Radio
