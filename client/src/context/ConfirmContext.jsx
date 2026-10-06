/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from "react";
import { Button, Dialog, Field, Textarea } from "../components/ui";

const ConfirmContext = createContext(null);

/**
 * const confirm = useConfirm();
 * if (await confirm({ title, body, confirmLabel, tone: "danger" })) ...
 * const reason = await confirm({ title, input: { label, minLength: 5 } }); // string or null
 */
export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const [value, setValue] = useState("");

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setValue("");
        setRequest({ ...options, resolve });
      }),
    []
  );

  const wantsInput = Boolean(request?.input);
  const minLength = request?.input?.minLength || 1;
  const canSubmit = !wantsInput || value.trim().length >= minLength;

  const finish = (confirmed) => {
    if (!request) return;
    request.resolve(confirmed ? (wantsInput ? value.trim() : true) : wantsInput ? null : false);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(request)}
        onClose={() => finish(false)}
        title={request?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => finish(false)}>
              {request?.cancelLabel || "Go back"}
            </Button>
            <Button variant={request?.tone === "danger" ? "danger" : "primary"} disabled={!canSubmit} onClick={() => finish(true)}>
              {request?.confirmLabel || "Confirm"}
            </Button>
          </>
        }
      >
        {request?.body}
        {wantsInput && (
          <Field label={request.input.label} hint={request.input.hint} className="mt-4" counter={`${value.length}/${request.input.maxLength || 500}`}>
            {(p) => (
              <Textarea
                {...p}
                autoFocus
                maxLength={request.input.maxLength || 500}
                placeholder={request.input.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </Field>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
