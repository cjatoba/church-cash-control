CREATE INDEX "custody_transfers_campaign_id_idx" ON "custody_transfers" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "installments_pledge_id_idx" ON "installments" USING btree ("pledge_id");--> statement-breakpoint
CREATE INDEX "loose_pledge_contributions_loose_pledge_id_idx" ON "loose_pledge_contributions" USING btree ("loose_pledge_id");--> statement-breakpoint
CREATE INDEX "loose_pledges_campaign_id_idx" ON "loose_pledges" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "one_off_donations_campaign_id_idx" ON "one_off_donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "pledge_types_campaign_id_idx" ON "pledge_types" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "pledges_campaign_id_idx" ON "pledges" USING btree ("campaign_id");