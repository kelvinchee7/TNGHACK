"""
ShareCalculationEngine — maps will clauses to RM transfer amounts.
Supports: percentage splits, fixed bequests, residual distribution.
"""
from decimal import Decimal, ROUND_HALF_UP


TOLERANCE = Decimal("0.01")


class ShareCalculationEngine:

    @staticmethod
    def calculate(will_data: dict, total_rm: float, beneficiaries: list) -> list[dict]:
        total = Decimal(str(total_rm))
        clauses = will_data.get("beneficiaries", [])
        instructions = []
        allocated = Decimal("0")
        residual_beneficiary_ids = []

        # Map clauses to approved beneficiaries by name (case-insensitive match)
        name_to_bene = {b.name_enc.lower(): b for b in beneficiaries}

        # First pass: fixed bequests and percentage splits
        for clause in clauses:
            bene_name = clause.get("name", "").lower()
            bene = name_to_bene.get(bene_name)
            if not bene:
                continue

            clause_type = clause.get("type", "percentage")
            transfer_method = bene.transfer_method or "TNG"

            if clause_type == "fixed":
                amount = Decimal(str(clause.get("fixed_rm", 0)))
                if allocated + amount > total + TOLERANCE:
                    raise ValueError(
                        f"OverallocationError: fixed bequest RM {amount} would exceed total RM {total}"
                    )
                allocated += amount
                instructions.append({
                    "beneficiary_id": bene.id,
                    "share_rm": float(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                    "transfer_method": transfer_method,
                    "fx_currency": bene.fx_currency,
                })

            elif clause_type == "percentage":
                pct = Decimal(str(clause.get("fraction", 0)))
                amount = (total * pct).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                allocated += amount
                instructions.append({
                    "beneficiary_id": bene.id,
                    "share_rm": float(amount),
                    "transfer_method": transfer_method,
                    "fx_currency": bene.fx_currency,
                })

            elif clause_type == "residual":
                residual_beneficiary_ids.append(bene.id)

        # Overallocation guard
        if allocated > total + TOLERANCE:
            raise ValueError(
                f"OverallocationError: allocated RM {allocated} exceeds total RM {total}"
            )

        # Second pass: residual split
        if residual_beneficiary_ids:
            remainder = (total - allocated).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            per_residual = (remainder / len(residual_beneficiary_ids)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            bene_map = {b.id: b for b in beneficiaries}
            for bid in residual_beneficiary_ids:
                bene = bene_map.get(bid)
                if not bene:
                    continue
                instructions.append({
                    "beneficiary_id": bid,
                    "share_rm": float(per_residual),
                    "transfer_method": bene.transfer_method or "TNG",
                    "fx_currency": bene.fx_currency,
                })

        return instructions
