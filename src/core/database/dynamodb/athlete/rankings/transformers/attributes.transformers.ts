import { AgeCategory, Discipline, Gender, RankingType } from 'shared/enums';
import { Utils } from 'shared/utils';
import { DDBOverloadedTableTransformer } from '../../../dynamodb.table.transformers';
import {
  buildCompositeKey,
  decodeStringToPoint,
  destructCompositeKey,
  encodePointToString,
} from '../../../utils/utils';
import { AllAttrs, DDBAthleteRankingsItem } from '../athlete.rankings.interface';

/**
 * Transformers define how the application level DTO objects transforms to DynamoDB attributes in a table
 */
export class AttrsTransformer extends DDBOverloadedTableTransformer<AllAttrs, DDBAthleteRankingsItem> {
  constructor() {
    super();
  }

  public prefixes = {
    PK: 'Athlete',
    SK_GSI: 'Rankings',
  };

  public attrsToItemTransformer = {
    athleteId: (pk: string) => destructCompositeKey(pk, 1),
    rankingType: (sk_gsi: string) => parseInt(destructCompositeKey(sk_gsi, 1), 10),
    year: (sk_gsi: string) => parseInt(destructCompositeKey(sk_gsi, 2), 10),
    discipline: (sk_gsi: string) => parseInt(destructCompositeKey(sk_gsi, 3), 10),
    gender: (sk_gsi: string) => parseInt(destructCompositeKey(sk_gsi, 4), 10),
    ageCategory: (sk_gsi: string) => parseInt(destructCompositeKey(sk_gsi, 5), 10),
    points: (gsi_sk: string) => decodeStringToPoint(gsi_sk),
  };

  public itemToAttrsTransformer = {
    PK: (id: string) => buildCompositeKey(this.prefixes.PK, id),
    SK_GSI: (
      rankingType: RankingType,
      year: number,
      discipline: Discipline,
      gender: Gender,
      ageCategory: AgeCategory,
    ) =>
      buildCompositeKey(
        this.prefixes.SK_GSI,
        !Utils.isNil(rankingType) && rankingType.toString(),
        !Utils.isNil(year) && year.toString(),
        !Utils.isNil(discipline) && discipline.toString(),
        !Utils.isNil(gender) && gender.toString(),
        !Utils.isNil(ageCategory) && ageCategory.toString(),
      ),
    LSI: () => undefined,
    GSI_SK: (points: number) => encodePointToString(points),
  };

  public transformAttrsToItem(dynamodbItem: AllAttrs): DDBAthleteRankingsItem {
    const { PK, SK_GSI, LSI, GSI_SK, ...rest } = dynamodbItem;
    return {
      athleteId: this.attrsToItemTransformer.athleteId(PK),
      rankingType: this.attrsToItemTransformer.rankingType(SK_GSI),
      discipline: this.attrsToItemTransformer.discipline(SK_GSI),
      gender: this.attrsToItemTransformer.gender(SK_GSI),
      ageCategory: this.attrsToItemTransformer.ageCategory(SK_GSI),
      year: this.attrsToItemTransformer.year(SK_GSI),
      points: this.attrsToItemTransformer.points(GSI_SK),
      ...rest,
    };
  }

  public transformItemToAttrs(item: DDBAthleteRankingsItem): AllAttrs {
    const { athleteId, rankingType, year, points, discipline, gender, ageCategory, ...rest } = item;
    return {
      PK: this.itemToAttrsTransformer.PK(athleteId),
      SK_GSI: this.itemToAttrsTransformer.SK_GSI(rankingType, year, discipline, gender, ageCategory),
      LSI: this.itemToAttrsTransformer.LSI(),
      GSI_SK: this.itemToAttrsTransformer.GSI_SK(points),
      ...rest,
    };
  }

  public primaryKey(
    athleteId: string,
    rankingType: RankingType,
    year: number,
    discipline: Discipline,
    gender: Gender,
    ageCategory: AgeCategory,
  ) {
    return {
      [this.attrName('PK')]: this.itemToAttrsTransformer.PK(athleteId),
      [this.attrName('SK_GSI')]: this.itemToAttrsTransformer.SK_GSI(rankingType, year, discipline, gender, ageCategory),
    };
  }
}
