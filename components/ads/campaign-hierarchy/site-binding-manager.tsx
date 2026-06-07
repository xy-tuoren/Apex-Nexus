"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SelectControl } from "@/components/ads/campaign-hierarchy/field-controls";
import type { GoogleAdAccount, GoogleMccAccount, Site } from "@/lib/types";

type SiteBindingManagerProps = {
  adAccounts: GoogleAdAccount[];
  deletingSiteIds?: Set<string>;
  isSaving?: boolean;
  mccAccounts: GoogleMccAccount[];
  newOperationMccId: string;
  newSite: string;
  open: boolean;
  savingSiteIds?: Set<string>;
  sites: Site[];
  onClose: () => void;
  onCreate: () => void;
  onDeleteSite: (siteId: string) => void;
  onNewOperationMccChange: (operationMccId: string) => void;
  onNewSiteChange: (site: string) => void;
  onUpdateSite: (siteId: string, patch: { operationMccId?: string; site?: string }) => void;
};

function SiteNameInput({
  disabled,
  site,
  onSave,
}: {
  disabled?: boolean;
  site: Site;
  onSave: (site: string) => void;
}) {
  const [value, setValue] = useState(site.domain);

  useEffect(() => {
    setValue(site.domain);
  }, [site.domain]);

  return (
    <Input
      className="h-9 text-sm"
      disabled={disabled}
      placeholder="example.com"
      spellCheck={false}
      value={value}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== site.domain) {
          onSave(trimmed);
        }
      }}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function formatCustomerId(customerId: string) {
  const normalized = customerId.replaceAll("-", "");
  return normalized.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
}

export function SiteBindingManager({
  adAccounts,
  deletingSiteIds = new Set<string>(),
  isSaving = false,
  mccAccounts,
  newOperationMccId,
  newSite,
  open,
  savingSiteIds = new Set<string>(),
  sites,
  onClose,
  onCreate,
  onDeleteSite,
  onNewOperationMccChange,
  onNewSiteChange,
  onUpdateSite,
}: SiteBindingManagerProps) {
  const operationMccOptions = mccAccounts
    .filter((account) => account.kind === "OPERATION_MCC")
    .map((account) => ({
      value: account.id,
      label: `${account.name} · ${formatCustomerId(account.customerId)}`,
    }));
  const accountCounts = new Map<string, number>();
  adAccounts.forEach((account) => {
    accountCounts.set(account.operationMccId, (accountCounts.get(account.operationMccId) ?? 0) + 1);
  });

  return (
    <Drawer
      open={open}
      direction="right"
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <DrawerContent className="z-[85] h-full max-w-none overflow-hidden rounded-none border-l border-[var(--hairline)] p-0 data-[vaul-drawer-direction=right]:w-[44rem] data-[vaul-drawer-direction=right]:sm:max-w-none">
        <DrawerHeader className="border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-caption-uppercase text-[var(--muted)]">站点账号绑定</p>
              <DrawerTitle className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                绑定站点与操作 MCC
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                管理站点对应的操作 MCC，用于过滤 Campaign 可选投放账号。
              </DrawerDescription>
            </div>
            <Button aria-label="关闭" size="icon-sm" type="button" variant="ghost" onClick={onClose}>
              <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <section className="grid gap-3 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">站点</label>
                <Input
                  placeholder="example.com"
                  value={newSite}
                  onChange={(event) => onNewSiteChange(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--body)]">操作 MCC</label>
                <SelectControl
                  options={operationMccOptions}
                  placeholder="选择操作 MCC"
                  value={newOperationMccId}
                  onChange={onNewOperationMccChange}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="h-10 w-full md:w-auto"
                  disabled={isSaving || !newSite.trim() || !newOperationMccId}
                  type="button"
                  onClick={onCreate}
                >
                  {isSaving ? (
                    <Spinner aria-hidden className="h-4 w-4" />
                  ) : (
                    <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  )}
                  新增绑定
                </Button>
              </div>
            </div>
          </section>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--canvas-soft)] hover:bg-[var(--canvas-soft)]">
                  <TableHead className="w-[13rem]">站点</TableHead>
                  <TableHead>操作 MCC</TableHead>
                  <TableHead className="w-[7rem] text-center">账号数</TableHead>
                  <TableHead className="w-[6rem] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-sm text-[var(--muted)]" colSpan={4}>
                      暂无站点绑定。
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site) => {
                    const isRowSaving = savingSiteIds.has(site.id);
                    const isRowDeleting = deletingSiteIds.has(site.id);
                    const isRowBusy = isRowSaving || isRowDeleting;
                    return (
                      <TableRow key={site.id}>
                        <TableCell>
                          <SiteNameInput
                            disabled={isRowBusy}
                            site={site}
                            onSave={(nextSite) => onUpdateSite(site.id, { site: nextSite })}
                          />
                        </TableCell>
                        <TableCell>
                          <SelectControl
                            disabled={isRowBusy}
                            options={operationMccOptions}
                            value={site.operationMccId}
                            onChange={(operationMccId) => onUpdateSite(site.id, { operationMccId })}
                          />
                        </TableCell>
                        <TableCell className="text-center text-sm tabular-nums text-[var(--body)]">
                          {accountCounts.get(site.operationMccId) ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            aria-label={`删除站点 ${site.name}`}
                            className="mx-auto h-8 w-8 px-0"
                            disabled={isRowBusy || sites.length === 1}
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => onDeleteSite(site.id)}
                          >
                            {isRowDeleting ? (
                              <Spinner aria-hidden className="h-4 w-4" />
                            ) : (
                              <Trash2 aria-hidden className="h-4 w-4 text-[var(--semantic-error)]" strokeWidth={1.75} />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
